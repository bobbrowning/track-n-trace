
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
*   await trace.init(req,'./');
*   foo='hello';
*   bar='world';
*   trace.log(foo,bar,{level='norm'});
*
**************************************************** */

let traceprog = '';
let tracelevel = '';
let tracetime = 0;
let outstream = undefined;
let stdlevels = ['min', 'norm', 'verbose', 'silly'];
let levels = stdlevels;

/* ***************************************************
*
*   trace.log(item1,item2,... {options});
*   Options   
*     -  level='xxx',    lists level xxx or above
*     -  break='*',      draws a line of '*'
*   trace.log(item,item..)   // assumes {level='norm}
*
*************************************************** */

exports.log = async function () {
  if (!tracelevel) { return; }
  // default level of request to 'norm',  if not stated
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

  let level = 'norm';
  let text = '';
  let lapse = (Date.now() - tracetime) / 1000;
  let output = '';
  lapse = lapse.toFixed(3);
  for (let i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] == 'object') {
      item = arguments[i];
      if (item) {
        if (item.level) {
          level = item.level;
          delete item.level;
        }
        if (item.text) {
          text = item.text;
          delete item.text;
        }
        if (item.break) {
          output += '\n';
          for (i = 0; i < 40; i++) {
            output += item.break;
          }
          delete item.break;
        }
      }
      if (item) {
        if (Object.keys(item).length !== 0) { output += `\nObject>>> ${arguments[i]}` }
        for (const key of Object.keys(item)) {
          if (typeof item[key] == 'object') {
            output += `\nInnerobject>>> ${key}`;
            for (const innerkey of Object.keys(item[key])) {
              output += `\n    ${innerkey}: ${item[key][innerkey]}`;
            }
          }
          else {
            output += `\n  ${text} ${key}: ${item[key]}`;
          }
        }
      }
    }
    else {
      output += `\n${arguments[i]}`;
    }
  }
  output = `\n **** ${caller} -> ${lapse} seconds - level ${level}  ****` + output;
  for (let i = 0; i < levels.length; i++) {
    if (level == levels[i]) {                //  We are at the level requested
      if (outstream) {
        outstream.write(output + '\n');
      } else {
        console.log(output);
      }
      break;
    }
    if (tracelevel == levels[i]) { break; } // Stop checking  we are at trace level
  }

  return ('OK');
}

/* *****************************************
* 
*                trace.init
*                ----------
* to be called once per transaction only
* parameters:
*   - request object 
*   - directory of trace control file
* e.g. trace.init(req,'./');
*
 **************************************** */
exports.init = function (req, controldir) {
  const fs = require('fs');
  const requestIp = require('request-ip');
  let data;
  let messages = '';
  try {
    data = fs.readFileSync(controldir + 'trace.config', 'utf8');
  } catch (err) {
    tracelevel = '';
    return (`initialised no log file - no trace`);
  }
  let ctrl = data.split('\n');
  let testip = null;
  let logfile = null;
  let priority = null;
  let note = null;
  levels = stdlevels;

  for (let i = 0; i < ctrl.length; i++) {
    if (ctrl[i].includes('#')) {               //    ignore comments
      let temp = ctrl[i].split('#');
      line = temp[0];
    }
    else {
      line = ctrl[i];
    }
    if (!line.includes('=')) { continue; }     // skip if no command
    let cmd = line.split('=');
    {
      let cmdname = cmd[0].toLowerCase();
      if (cmdname == 'note') {
        note = cmd[1];
      }
      let cmddata = cmd[1].replace(/\s/g, '')               // dump any white 
      cmddata = cmddata.toLowerCase();
      if (cmdname == 'level') { tracelevel = cmddata; }
      if (cmdname == 'source') { traceprog = cmddata; }
      if (cmdname == 'ip') { testip = cmddata; }
      if (cmdname == 'log') { logfile = cmddata; }
      if (cmdname == 'priority') {
        levels = cmddata.split(',');
        priority = cmddata;
      }
    }

  }
   /*
   if (ctrl[0]) {ctrl[0] = ctrl[0].replace(/\s/g, ''); } // get rid of any whitespace
   if (ctrl[1]) {ctrl[1] = ctrl[1].replace(/\s/g, '');}  // get rid of any whitespace
 
   let logfile = '';
   let userip = requestIp.getClientIp(req);
   tracetime = Date.now();
 
   // *********** get the ctrl file line 1 (tracelevel, ip addrss, log file)
   let txt = ctrl[0].split(',');
   tracelevel = txt[0];
   traceprog = txt[1];
   let testip = txt[2];
   logfile = txt[3];
   */
  let userip = requestIp.getClientIp(req);
  tracetime = Date.now();
  if (tracelevel=='none') {
    tracelevel='';
  }
  if ((testip) && (userip != testip)) {
    tracelevel = '';
  }
  if (!levels.includes(tracelevel)) {
    tracelevel = '';
  }  // 
  if (!tracelevel) {
    return (`initialised - no trace`);
  }
  if (logfile) {
    outstream = fs.createWriteStream(logfile, { flags: 'a' });
  }
  else {
    outstream = undefined;
  }

  /*
    // ************** get the ctrl file line 2 (replacement levels list)
    if (ctrl[1]) {
      levels = ctrl[1].split(',');
    }
    else {
      levels = stdlevels;
    }
    */

  //  leave a message on the console
  let date = new Date();
  displaydate = date.toISOString();
  let only = '';
  if (testip) { only = 'only'; }
  let program = '';
  if (traceprog) { program = `\nProgram file: ${traceprog}`; }
  if (tracelevel) {
    messages += `***** Tracing transactions from client: ${userip} ${only} *****`;
    messages += `\nDate: ${displaydate}`;
    messages += `\nControl file: ${controldir}trace.config`;
    messages += `\nLevel:  ${tracelevel}`;
    if (traceprog) { messages += `\nSource file: ${traceprog}`; }
    if (priority) { messages += `\nBespoke priority levels: [${priority}]` }
    if (logfile) {
      messages += `\nLog file: ${logfile}`;
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
