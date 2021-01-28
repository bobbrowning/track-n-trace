
/* ***************************************************
*
*                      trace
*                      -----
*   Trace progress through a program.  Trace statements
*   can be added at any point in the code to log important  
*   data.  Features:
*
*   * Traces can be turned on or off in real time under control  
*     of a small text file. You don't need to restart. 
*
*   * Traces can be limited to requests from a given
*     IP address - so can be used in a live system without  
*     interfering with other users transactions.
*
*   * Traces can be limited to a one javascript file.
*     or the whole system.
*
*   * Traces can be sent to the console or a text file.
* 
*  For details see the readme at 
*  https://github.com/bobbrowning/track-n-trace
*
*
*   trace=require(track-n-trace);
*   await trace.init(req,'./');   // Optional if you need the IP filtering feature
*   foo='hello';
*   bar='world';
*   trace.log(foo,bar,{level='norm'});
*
**************************************************** */

exports.log = log;
exports.init = init;


// Local data
let oldlogfile = '';         // The current log file  (old when in init())
let traceprog = '';          // only trace this code file
let tracelevel = '';         // trace level
let tracetime = 0;           // time of the last init
let outstream = undefined;   // Log file
let stdlevels = ['min', 'norm', 'verbose', 'silly'];  // standard leels
let levels = stdlevels;      //  levels used (can be changed by the conf file)
let maxDepth = 3;            // depth of nesed objects listed
let lineWidth = 60;
let indent = 0;              // used internally 
let nextInit = 0;            // next init time in milliseconds
let initInterval = 5;        // 5 minutes between runs

/* ***************************************************
*
*   trace.log(item1,item2,... {options});
*   Options   
*     -  level='xxx',    lists level xxx or above
*     -  break='*',      draws a line of '*'
*   trace.log(item,item..)   // assumes {level='norm}
*
*************************************************** */



async function log() {

  //  Call the init routine according to refresh interval
  if (Date.now() > nextInit) {
    init(false, './');
  }

  //  if no trace level then that is it...
  if (!tracelevel) { return; }


  /* ***********************************************  
 *
 * work out the code file and line number of the trace call
 * by pretending there is an error and scanning error text 
 * if the config is set to only trace one program, return 
 * if this is not the program.
 *
 *********************************************** */
  error = new Error();
  let stack = error.stack.split(' at ');
  let caller = '';
  for (let i = 1; i < stack.length; i++) {
    if (!stack[i].includes('/trace.js')) {
      caller = stack[i];
      break;
    }
  }
  callerarray = caller.split('/');
  caller = callerarray[callerarray.length - 1];
  caller = caller.split(')')[0];
  let temp = caller.split(':');
  program = temp[0];
  if (traceprog && program != traceprog) { return; }

  indent = 0;

  /* ***********************************************  
  *
  *  Assemble listing and ouput at the end. 
  *  Not argument by argument. 
  *  This is because the options may come at the end...
  * 
  *  Set up data.  Default level is 'norm'
  *  other options are picked up any object included in 
  *  the parameter list.    
  *
  *  Then loop through arguments.
  *
  *********************************************** */

  let level = 'norm';   // default level if not in the options

  let output = '';
  let item;

  // loop now
  for (let i = 0; i < arguments.length; i++) {

    // if this is an object look for options.. Store them and delete from 
    // object.
    if (typeof arguments[i] == 'object' && arguments[i] != null) {
      item = arguments[i];
      if (item) {            // Anything in it?
        if (item.level) {
          level = item.level;
          delete item.level;
        }
        if (item.break) {
          output += '\n';
          output += item.break.repeat(lineWidth);
          delete item.break;
        }
      }

      // if the object only had options in it go on to next argument
      if (Object.keys(item).length == 0) { continue }

      let result = listObject(item);
      output += `\n${result}`;
    }   // End object processing..
    else {
      let val = fixForOutput(arguments[i]);
      output += `\n${val}`;
    }
  }

  //  Trace heading  - lapse is seconds since init.
  let lapse = (Date.now() - tracetime) / 1000;
  lapse = lapse.toFixed(3);

  let final = `
${'-'.repeat(lineWidth)}
${caller} -> ${lapse} seconds - level ${level}  ${output}`;

  // Now see if we should output it... 
  // not ideal, but the options might come at the end. 
  for (let i = 0; i < levels.length; i++) {
    if (level == levels[i]) {                //  We are at the level requested
      if (outstream) {
        outstream.write(final + '\n');
      } else {
        console.log(final);
      }
      break;
    }
    if (tracelevel == levels[i]) { break; } // Stop checking  we are at trace level
  }
  // Tidy up
  indent = 0;
  return ('OK');
}

/* ***********************************************  
 *
 * Format data items depending on type 
 *
 *********************************************** */

function fixForOutput(val) {
  //  console.log(171,val, typeof val);
  if (val == null) {
    return ('null');
  }
  if (typeof val == 'string') {
    return (`'${val}'`);
  }
  if (typeof val == 'function') {
    return ('Function');
  }
  if (typeof val == 'boolean') {
    if (val) { val = 'true' } else { val = 'false' }
    return (val);
  }
  if (typeof val == 'object') {
    if (val.constructor.name === "RegExp") {
      return (`${val} (Regexp)`);
    }
    // This sequence can be called recursively with 
    // nested objects. Indented for each
    indent++;
    if (indent >= maxDepth) {
      val = `[Deeper Object below level ${indent}`;
    }
    else {
      val = listObject(val);
    }
    indent--;
    return (val);
  }
  return (val);
}
/* ***********************************************  
 *
 * List an object.  
 *
 *********************************************** */
function listObject(obj) {
  let result = ''

  // The separator between items is '|||'. At he end of the 
  // object we work out how wide the line is. Depending on 
  // line length the bars are repaced by one space or 
  // a newline.  This keeps short objects on one line.
  // bars keps count so we can take account in working out length.
  let bars = 0;

  // Spacing before each tine.  Two spaces per indent. 
  let spacing = ' '.repeat(indent * 2);

  // Start object..
  if (Array.isArray(obj)) {
    result += '[';
  }
  else {
    result += '{';
  }

  // loop through object
  for (let key of Object.keys(obj)) {

    // may be an object. In which case this will be called recursively.
    let val = fixForOutput(obj[key]);

    // format will depend on whether an array or not
    if (Array.isArray(obj)) {
      result += `|||${val}, `;
    }
    else {
      result += `|||${key}: ${val}, `;
    }
  }

  // Finish object listing
  if (Array.isArray(obj)) {
    result += '|||]';
  }
  else {
    result += `|||}`;
  }

  //  Will we be on a single line or multo-line
  if (result.length - (bars * 3) > lineWidth) {
    result = result.split('|||').join('\n' + spacing);
  }
  else {
    result = result.split('|||').join(' ');
  }

  return (result);
}

/* *****************************************
* 
*                trace.init
*                ----------
*  Will be called regularly to refresh the config.
*
*  If the IP filtering feature is used or the
*  config file is not in the project directory. 
*  The function must be called by 
*  the app once at the start of each transaction.
*  Two reasons:
*  - req object is needed so require app to pass it on
*  - needs to be checked once per transaction only
*    if relying on refresh period it might cover 
*    several transactions.  
*
* parameters:
*   - request object    // only if called by the app, otherwise false
*   - directory of trace control file
* e.g. trace.init(req,'./');
*
 **************************************** */
function init(req, controldir) {

  const fs = require('fs');
  const requestIp = require('request-ip');

  // re-initialise the data
  traceprog = '';
  tracelevel = '';
  levels = stdlevels;
  maxDepth = 3;
  lineWidth = 60;
  indent = 0;
  initInterval = 5;  // 5 minutes between runs

  let testip = null;   // IP tested against
  let logfile = null;  // name of log file
  let priority = null;
  let note = null;




  //  read the config file
  let data;
  try {
    data = fs.readFileSync(controldir + 'trace.config', 'utf8');
  } catch (err) {
    tracelevel = '';
    console.log('no Track-n-trace control file');
    return (`initialised no log file - no trace`);
  }


  // parse the log file data
  let ctrl = data.split('\n');      // array of lines
  for (let i = 0; i < ctrl.length; i++) {
    if (ctrl[i].includes('#')) {               //    ignore comments
      let temp = ctrl[i].split('#');
      line = temp[0];                           // line without comments
    }
    else {
      line = ctrl[i];
    }
    if (!line.includes('=')) { continue; }     // skip if not command
    let cmd = line.split('=');   // command and value
    {
      let cmdname = cmd[0].replace(/\s/g, '').toLowerCase();    // dump any white space

      // assign commands to variables 
      if (cmdname == 'note') {
        note = cmd[1];
      }
      let cmddata = cmd[1].replace(/\s/g, '').toLowerCase();  // dump any white space
      if (cmdname == 'level') { tracelevel = cmddata; }
      if (cmdname == 'source') { traceprog = cmddata; }
      if (cmdname == 'ip') { testip = cmddata; }
      if (cmdname == 'maxdepth' && cmddata) {
        let data = parseInt(cmddata);
        if (data > 0) { maxDepth = data; }
      }
      if (cmdname == 'log') { logfile = cmddata; }
      if (cmdname == 'refresh') { initInterval = cmddata; }
      if (cmdname == 'linewidth') { lineWidth = cmddata; }
      if (cmdname == 'priority') {
        levels = cmddata.split(',');
        priority = cmddata;
      }
    }

  }

  //  Conditions for no trace...

  // allow 'none' to stop tracing
  if (tracelevel == 'none') {
    tracelevel = '';
  }

  // If caled on refresh scedule req will contain false. 
  // so must be called by the app.  
  // If no match then stop tracing
  let userip = '';
  if (req) { userip = requestIp.getClientIp(req); }
  if (userip) {
    if ((testip) && (userip != testip)) {
      tracelevel = '';
    }
  }

  //  if the level is not in the set of levels stop tracing
  if (!levels.includes(tracelevel)) {
    tracelevel = '';
  }


  //  Current time and time of next init run
  tracetime = Date.now();
  let date = new Date();
  let displaydate = date.toISOString();
  nextInit = tracetime + (60000 * initInterval);
  let next = new Date(nextInit);
  let nextdate = next.toISOString();

  // Output message to console  if not trace
  if (!tracelevel) {
    console.log(`
    No traces
    Date: ${displaydate}
    Next trace config refresh: ${nextdate}  (${initInterval} minutes)
    `);

    return (`initialised - no trace`);
  }

  //  we are tracing

  //  Log file
  if (oldlogfile && !logfile)  //  end  of logfile so close
  {
    outstream.end('end');
    outstream = undefined;
  }
  if (logfile && logfile != oldlogfile) {   // new or changed logfile
    if (oldlogfile) { outstream.end('end'); }                  // close old file
    outstream = fs.createWriteStream(logfile, { flags: 'a' });
  }
  oldlogfile = logfile;



  //  leave a message on the console

  let only = '';
  if (userip) { only = 'only'; }
  let program = '';
  if (traceprog) { program = `\nProgram file: ${traceprog}`; }
  if (tracelevel) {
    messages = `
***** Tracing transactions from client: ${userip} ${only} *****
Date: ${displaydate}
Next config refresh: ${nextdate}  (${initInterval} minutes)
Control file: ${controldir}trace.config
Maximum depth of nested objects: ${maxDepth}
Level:  ${tracelevel}`;
    if (traceprog) { messages += `\nSource file: ${traceprog}`; }
    if (priority) { messages += `\nBespoke priority levels: [${priority}]` }
    if (logfile) {
      messages += `\nLog file: ${logfile}`;
    }
    if (!req && testip) {
      messages += `

Filter by users IP ${testip} is not available.
To filter by IP you will need to call trace.init(req,'./') somewhere 
in the app at the start of the transaction.
`;
    }
    if (note) { messages += `\nNote: \n${note}`; }     // if no logfile - already sent to console


  }
  if (outstream) {
    outstream.write(messages + '\n');
  } else {
    console.log(messages);
  }



  // that's it     
  return (`OK`);
}





