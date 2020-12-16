 

# Track-n-Trace

Trace progress through a Node program.  Trace statements    can be added at any point in the code to log important      data.  A bit like console.log but with very useful enhancements:

1. Different levels of tracing means that you can list only important steps or every trace call.  There is are default levels but you can define your own.

2. Traces can be turned on or off in real time under control of a small text file. You don't need to restart.  So keep  trace statements in the code to help diagnose problems in production. Because.....

3. Traces can be limited to requests from a given      IP address - so can be used in a live system without        interfering with other users transactions.

4. Traces can be limited to a one javascript code file      or the whole system.

5. Traces can be sent to the console or a text file.
 
##   Control file

The control, file takes the form of lines containing command=data.  The '#' character is used for comments.  To turn off tracing use level=none (or delete/rename the file).


This will list traces with this level or preceding this in the priority list. The default list is [min,norm,verbose,silly]. 
  
The commands are:

1. **level=** Trace.log traces if the level in the call is equal or preceding this. 
2. ***source=** Name of the javascript file to be traced. If omitted the whole system will be traced
3. **ip=** Trace is only honoured for requests from that IP. If omitted, any IP will cause the trace to output. This is very useful in a live system because it means that you can trace a particular problem without interfering with normal use.
4. **log=**  Output to this file. If omitted, output goes to the console  
5. **note=** Anything on this line is listed on the output.
6. **priority=** Comma separated list of levels to be used instead of the default list

   
###   Examples

The minimum control file is 
```
level=xxx
```
This example shows every option
```
level=verbose
ip=192.168.0.12            # If omitted from any IP
source=admin.js            # If omitted from all source files
priority=verbose,silly     # if omitted assumed min,norm,verbose,silly
note=Test 36               # Optional note at beginning of trace listing
```
This example only traces the bespoke level, from anywhere, logs to the console.
```
 level=mylevel
 priority=mylevel
```

  


##  Functions 
  
 **trace.init()** - called once per request only.  Reads the  text file and sets up local variables.

 **trace.log()** -  Normal trace call


###   trace.init(req,dir)
   
 To be called once per transaction only.  parameters:
1. request object 
2. directory of trace control file

example:

            let trace=require('track-n-trace');
            trace.init(req,'./');


###  trace.log(item1,item2,... {options})
   

trace.log (item1,item2,... {options})
Options are 
1.   **level:'xxx',** (if omitted 'norm' is assumed)     
2.   **break:'x',**  draws a line of 40 x the entered character to help locate in the output.
3.  anything else is treated as a data item. So {foo:'bar'}  is the same as '\nfoo',':','bar'

###      examples:  
  ```
        trace.log('Name of table: ',tablename);     // assumes level='norm'
        trace.log('Name of table: ',tablename,{level:'min'}); 
        trace.log('start of transaction',{level:'min',break:'#'})  
  ```

##   Output
   
   entry point   ->  n.nnn seconds followed by data.
  
  The entry point is the name and line number of the call
  in the calling program.  The time is the time since 
  trace.init() was called. 

  The data is as listed in the function call. 
  
  If an item  is an object it is preceded by 
  Object>>>    each item in the object listed on a separate line.

  name:value
  
  if that object conains another it is preceded by  Innerobject>>>

## Example of use 

   example.js
  ```
  let trace = require('track-n-trace');
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
