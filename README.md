 

# Track-n-Trace

Trace progress through a Node program.  Trace statements    can be added at any point in the code to log important data.  A bit like console.log but with very useful enhancements:

1. Traces can be turned on or off in real time under control of the config file (trace.config). You don't need to restart.  So keep  trace statements in the code to help diagnose problems in production. Because.....

2. Traces can be limited to requests from a given IP address.  This is very valuable because if you hit problems in a live site, you can switch tracing on by editing the config file. You can often identify problems without having to restart the app. 

3. Different levels of tracing means that you can control which statements get listed.  There is are default levels but you can define your own.

4. Traces can be limited to a one javascript code file      or the whole system.

5. Traces can be sent to the console or a text file.

6. You can control the depth to which nested objects are listed (object containing objects).


## Installation
```
npm install request-ip
npm install track-n-trace
```
The config file shoul be placed in the root directory of the node project. A sample is in the track-n-trace directory.

##   Control file

The control file is called trace.config. The default location is the root directory of the node project.

The control, file takes the form of lines containing command=data.  The '#' character is used for comments.  To turn off tracing use level=none (or delete/rename the file).


This will list traces with this level or preceding this in the priority list. The default list is [min,norm,verbose,silly]. 
  
The commands are:

1. **level=** Trace.log traces if the level in the call is equal or preceding this. 
2. **source=** Name of the javascript file to be traced. If omitted the whole system will be traced
3. **ip=** Trace is only honoured for requests from that IP. If omitted, any IP will cause the trace to output. This is very useful in a live system because it means that you can trace a particular problem without interfering with normal use.
4. **log=**  Output to this file. If omitted, output goes to the console  
5. **note=** Anything on this line is listed on the output.
6. **priority=** Comma separated list of levels to be used instead of the default list
7. **maxdepth** The maximum depth to which nested objected should be listed.
8. **linewidth** Width of line in characters.  The program will attempt to keep short objects on one line.

   
###   Examples

The minimum control file which results in traces is 
```
level=norm
```
To turn traces off simply comment out this line, or rename the file.

This example shows every option
```
level=norm          # comment out to switch traces off.
ip=192.168.0.12     # If omitted, transactions from any IP will be traced
                    #    Requires aditional code. 
source=admin.js     # Only trace if the ip address of the client is this
priority=bob,extra  # Priority list, comma separated. If omitted assumed 
                    #   [min,norm,verbose,silly]
note=Test 36        # Optional note at beginning of trace listing
log=trace.log       # output to file. If omitted goes to concole.
linewidth=60        # Number of characters per line. Program will attempt to  
                    #   show small objects on one line. Default 60.
maxdepth=5          # Depth of nested onjects to be shown (default 3).
refresh=3           # Time between refreshing from the config file in minutes

```
This example only traces the bespoke level, which might be as little as one call. 
```
 level=mylevel
 priority=mylevel

```



##  Functions 
  
 **trace.log()** -  Normal trace call

 **trace.init()** - Required if the IP filtering feature is used. Called once per request only.  Reads and processes the the  config file so that changes are recognised.  Also needed if the config file is in a non-standard location.

###  trace.log(item1,item2,... {items,...,  options})
   
A parameter which is an object may contain options.  
1.   **level:'xxx',** (if omitted 'norm' is assumed)     
2.   **break:'x',**  draws a line of [line length] x the entered character to help locate in the output.

Anything else is treated as a data item. So {foo:'bar'}  is the same as '\nfoo,:','bar'


###   trace.init(req,dir)
   
 To be called once per transaction only.  parameters:
1. request object 
2. directory of trace control file

example:

            let trace=require('track-n-trace');
            trace.init(req,'./');  // Only needed if IP filtering used


###      examples:  
  ```
        trace.log(tablename,id,title);                                  // assumes level='norm'
        trace.log ({'Name of table': tablename, id:id, title:title });  // nicer output
        trace.log(tablename,id,{title:title, level:'verbose'});                // level 'verbose'
        trace.log('start of transaction',{level:'min',break:'#'});      // draws line of hashes
  ```

##   Output

Parameters are listed once per line.  Entry point, number of seconds since the last refresh plus the level.   Objects are then listed on one line (as above) if it can be done within the line length. If too long the objects are listed with one item per line.  Nested objects are indented. 
 

example:
In code file admin.js

```
let trace = require('track-n-trace');
trace.init(req, './');  // optional unless IP filtering is used
    ...
trace.log(id,{tablename:tablename,title:title, level: 'min'});
```
   
------------------------------------------------------------
admin.js:60:11 -> 0.006 seconds - level norm  
10
{ tablename: 'customers', title: 'Customer file', }

The entry point is the name and line number (60) of the call.
The time is the time since the config was refreshed. 


