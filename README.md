 

# Trace

   Trace progress through a Node program.  Trace statements    can be added at any point in the code to log important      data.  A bit like console.log but with very useful enhancements:
  1. Different levels of tracing means that you can list only important steps or every trace call.  There is a default list of levels but you can define your own. 
  2.Traces can be turned on or off in real time under control of a small text file. You don't need to restart.  So keep       trace statements in the code to help diagnose problems       in production. Because.....  
  3. Traces can be limited to requests from a given      IP address - so can be used in a live system without        interfering with other users transactions.
  4. Traces can be limited to a one javascript code file      or the whole system.
  5. Traces can be sent to the console or a text file.
 
##   Control file

  This is a csv file. Data items are as follows. All are optional 
   but omit the level or put in a level that is not in the priority list
   and there will be no trace.

   The only essential item is the level. Most of the time the text file will just contain one word, e.g. 

   norm

   Fo normal level of tracing. To switch traces off  just delete or rename the file. But for finer control you have a number of options, from outputting every trace call in your system down to just one single call.
  
###   Line 1
```
level,filename,ip,logfile
```

1. **Level:** Trace.log traces if the level in the call is at or below the priority of the level in the control file. Default levels in priority order are: *min,norm,verbose,silly* but these can be changed in line 2(below).
2. **file name:** Name of the javascript file to be traced. If omitted the whole system will be traced
3. **IP address:** Trace is only honoured for requests from that IP. If omitted, any IP will cause the trace to output. This is very useful in a live system because it means that you can trace a particular problem without interfering with normal use.
4. **Log File**  -  Output to this file. If omitted, output goes to the console  

###  Line 2

On the lext line you can add a list of levels in priority order. If omitted the default values above are used.
   
###   Examples
                  norm

  *This example is normal trace level on the whole system from anywhere with output to the console. That is probably the most common setting.*
              
                 norm,myprog.js,192.168.0.12,trace.log  
                 min,norm,max
               
  *This example:
  - traces myprog.js
  - norm level,
  - only requests from one IP adress
  - traces to a log file,
  - changes standard levels list.*

               mylevel
               mylevel
  
  *This example only traces the bespoke level, from anywhere, logs to the console.*

               verbose
               
*this traces every level except 'silly'.*

               ,,,   
               
*No trace (or delete/rename the file)*

##  Functions 
  
 trace.init() - called once per request only.  Reads the  
                  text file and sets up local variables.
 trace.log() -  Normal trace call


###   trace.init(req,dir)
   
 To be called once per transaction only
 parameters:
* request object 
* directory of trace control file

 example:
            let trace=require('trace');
            trace.init(req,'./');


###  trace.log(item1,item2,... {options})
   

    trace.log (item1,item2,... {options})
    Options are 
    1.   level: (if omitted 'norm' is assumed)     
    2.   break: 'x'  draws a line of 40 x the entered character to help locate in the output.
    3.  anything else is treated as a data item. So {foo:'bar'}  is the same as '\nfoo','bar'

###      examples:  
  ```
        trace.log('Name of table: ',tablename);     // assumes level='norm'
        trace.log('Name of table: ',tablename,{level:'min'}); 
        trace.log('start of transaction',{level:'min',break:'#'})  
  ```

##   Output
   
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

## Example of use 

 control file =  norm,,192.168.0.12 


  example.js
  ```
  let trace = require('trace');
  await trace.init(req,'./');    // req is the request object    ./ is the location of the control file
  let foo='hello';
  let bar='world';
  trace.log(foo,bar);
 ```
  when the request originated at a browser at 192.168.0.12 gives on the console
 
   ```
  **** example.js:6:11 -> 0.001 seconds ****
  hello world
```


