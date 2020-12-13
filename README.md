 

Trace
-----
   Trace progress through a Node program.  Trace statements
   can be added at any point in the code to log important  
   data.  Features:

    * Traces can be turned on or off in real time under control  
      of a small text file. You don't need to restart.  So keep 
      trace statements in the code to help diagnose problems 
      in production. Because.....  

    * Traces can be limited to requests from a given
      IP address - so can be used in a live system without  
      interfering with other users transactions.

    * Traces can be limited to a one javascript file.
      or the whole system.

    * Traces can be sent to the console or a text file.
 
   Control file
   -----------
   This is a csv file. Data items are as follows. All are optional 
   but omit the level or put in a level that is not in the priority list
   and there will be no trace.
  
   Line 1
   ------
   Level: Trace.log traces if the level in the call is at or below the priority of the level in the control file. Default levels in priority order are: [min,norm,verbose,silly] but these can be changed in line 2(below).
                
   file name: Name of the file to be traced. If omitted the whole system will be traced

  IP address: Trace only honoured for requests from that IP. If omitted, any IP.

  Log File   -  Output to this file. If omitted to the console  

  Line 2
  ------
  On the lext line you can add a list of levels in priority order. If omitted the default values above are used.
   
   Examples
   -------
               norm,myprog.js,192.168.0.12,trace.log  
               min,norm,max
               
               This example:
                 - traces myprog.js
                 - norm level,
                 - only requests from one IP adress
                 - traces to a log file,
                 - changes standard levels list.

               mylevel
               mylevel
               (this example only traces the bespoke level, from anywhere, logs to the console)

               verbose
               (this traces every level except 'silly'.)

               ,,,   
               (no trace (or delete/rename the file))

  Functions 
  ---------
   trace.init() - called once per request only.  Reads the  
                  text file and sets up local variables.
   trace.log() -  Normal trace call


   trace.init
   ----------

      To be called once per transaction only
      parameters:
               - request object 
               - directory of trace control file

      e.g.  let trace=require('trace');
            trace.init(req,'./');


   trace.log
   ---------

    trace.log (item1,item2,... {options})
    Options are 
       level: (if omitted 'norm' is assumed)     
       break: 'x'  draws a line of 40 x the entered character
                   to help locate in the output.
         
       anything else is treated as a data item. So 
       {foo:'bar'}  is the same as '\nfoo','bar'

      example:  
        trace.log('Name of table: ',tablename);     // assumes level='norm'
        trace.log('Name of table: ',tablename,{level:'min'}); 
        trace.log('start of transaction',{level:'min',break:'#'})  
  
   Output
   ----- 
   entry point   ->  n.nnn seconds 
   followed by data.
  
  The entry point is the name and line number of the call
  in the calling program.  The time is the time since 
  trace.init() was called. 

  The data is as listed in the function call. If an item 
  is an object it is preceded by 
  Object>>> 
  each item in the object listed on a separate line.
  name:value
  if that object conains another it is preceded by 
   Innerobject>>>

Example of use
--------------
    control file 
    
    norm,,192.168.0.12 


  // example.js
  let trace = require('trace');
  await trace.init(req,'./');    // req is the request object    ./ is the location of the control file
  let foo='hello';
  let bar='world';
  trace.log(foo,bar);

  when the request originated at a browser at 192.168.0.12 gives on the console
  
  **** example.js:6:11 -> 0.001 seconds ****
  hello world



