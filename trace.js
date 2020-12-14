
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
*                  Control file
*                  -----------
*   This is a csv file. Data items are:
*  
*   Line 1
*   ------
*    Level -      Trace.log traces if the level in the call is  
*                at or below the priority of the level  
*                in the control file. Default levels in 
*                priority order are: min,norm,verbose,silly
*                but these can be changed in the control file.
*                
*
*   code file -  Name of the file to be traced. If omitted the 
*                system will be traced
*
*  IP address -  Trace only honoured for requests from that IP
*
*  Log File   -  Output to this file. If omitted to the console  
*
*  Line 2
*  ------
*  Levels     -  On the lext line you can add a list of levels in 
*               proprity order. If omitted this is assumed to be
*                min,norm,verbose,silly
*   
*   examples
*   -------
*               norm,myprog.js,192.168.0.12,trace.log  
*               min,norm,max
*               This example:
*                 - traces myprog.js
*                 - norm level,
*                 - only requests from one IP adress
*                 - traces to a log file,
*                 - changes standard levels list.
*
*               mylevel
*               mylevel
*               (this example only traces one bespoke level)
*
*               verbose
*               (this traces every level except 'silly'.)
*
*               ,,,   
*               (no trace (or delete/rename the file))
*
*                   Functions 
*                   ---------
*   trace.init() - called once per request only.  Reads the  
*                  text file and sets up local variables.
*   trace.log() -  Normal trace call
*
*
*                trace.init
*                ----------
*      To be called once per transaction only
*      parameters:
*               - request object 
*               - directory of trace control file
*
*      e.g.  let trace=require('trace');
*            trace.init(req,'./');
*
*
*                trace.log
*                ---------
*    trace.log (item1,item2,... {options})
*    Options are 
*       level: (if omitted 'norm' is assumed)     
*       break: 'x'  draws a line of 40 x the entered character
*         
*       anything else is treated as a data item. So 
*       {foo:'bar'}  is the same as '\nfoo','bar'
*
*      example:  
*        trace.log('Name of table: ',tablename);     // assumes level='norm'
*        trace.log('Name of table: ',tablename,{level:'min'}); 
*        trace.log('start of transaction',{level:'min',break:'#'})  
*  
*   output
*   ----- 
*   **** entry point   ->  n.nnn seconds ****
*   followed by data.
*  
*  The entry point is the name and line number of the call
*  in the calling program.  The time is the time since 
*  trace.init() was called. 
*
**************************************************** */

let traceprog='';
let tracelevel = '';
let tracetime = 0;
let outstream = undefined;
let stdlevels = ['min', 'norm', 'verbose', 'silly'];
let levels=stdlevels;


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
  let temp=caller.split(':');
  program=temp[0];
  if (traceprog && program != traceprog ) { return; }
  
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
  output=`\n **** ${caller} -> ${lapse} seconds - level ${level}  ****` + output;
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
   let messages='';
  try {
    data = fs.readFileSync(controldir + 'trace.txt', 'utf8');
  } catch (err) {
    tracelevel = '';
    return (`initialised no log file - no trace`);
  }
  let ctrl = data.split('\n');
  if (ctrl[0]) {ctrl[0] = ctrl[0].replace(/\s/g, ''); } // get rid of any whitespace
  if (ctrl[1]) {ctrl[1] = ctrl[1].replace(/\s/g, '');}  // get rid of any whitespace

  let logfile = '';
  /*
    let forwardedIpsStr = req.header('x-forwarded-for');
    let userip = '';
    if (forwardedIpsStr) {
      userip = forwardedIps = forwardedIpsStr.split(',')[0];
    }
  */
  let userip = requestIp.getClientIp(req);
  tracetime = Date.now();

  // *********** get the ctrl file line 1 (tracelevel, ip addrss, log file)
  let txt = ctrl[0].split(',');
  tracelevel = txt[0];
  traceprog = txt[1];
  let testip = txt[2];
  logfile = txt[3];
  if ((testip) && (userip != testip)) {
    tracelevel = '';
  }
  if (!tracelevel) {
    return (`initialised - no trace`);
  }
  if (logfile) {
    outstream = fs.createWriteStream(logfile, { flags: 'a' });
  }
  else {
    outstream = undefined;
  }
  

  // ************** get the ctrl file line 2 (replacement levels list)
  if (ctrl[1]) {
    levels = ctrl[1].split(',');
  }
  else
  {
    levels=stdlevels;
  }
  if (!levels.includes(tracelevel)) {
    messages += `No level "${tracelevel}" in list - no trace`;
    tracelevel = '';
  }  // 

  //  leave a message on the console
  let date = new Date();
  display = date.toISOString();
  let only = '';
  if (testip) { only = 'only'; }
  let log = '';
  if (logfile) { log = `\nLog file: ${logfile}`; }
  let program='';
  if (traceprog) { program = `\nProgram file: ${traceprog}`; }
  if (tracelevel){
  messages+=`***** Tracing transactions from client: ${userip} ${only} *****\
     \nControl file: ${controldir}trace.txt\
     \nLevel:  ${tracelevel}${program}\
     \nDate: ${display}\
     ${log}`;
  }
  if (outstream) {
    outstream.write(messages+'\n');
  } else {
    console.log(messages);
  }



  // that's it     
  return (`OK`);
}
