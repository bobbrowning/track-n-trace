 

# Track-n-Trace

Trace progress through a Node program.  Trace statements    can be added at any point in the code to log important data.  A bit like console.log but with very useful enhancements:

1. Traces can be turned on or off in real time under control of the config file (trace.config). You don't need to restart.  So keep  trace statements in the code to help diagnose problems in production. Because.....

2. Traces can be limited to requests from a given IP address.  This is very valuable because if you hit problems in a live site, you can switch tracing on without affecting other users. Their traces won't get mixed up with yours. You can often identify problems without having to restart the app. 

3. Different levels of tracing means that you can control which statements get listed.  There is are default levels but you can define your own.  

4. Traces can be limited to a one javascript code file, and even in a range of line numbers within that file. 

5. Traces can be sent to the console or a text file.

6. You can control the depth to which nested objects are listed (object containing objects).  You can also chop very large strings if that becomes an issue.

7. The listing includes the javascript file and line number from which it was called.  It also includes the number of elapsed seconds, which may help to identify performance problems.


## Installation
```
npm install track-n-trace
```
The config file should be placed in the root directory of the node project. A sample is in the track-n-trace directory.

##   Control file

The control file is called trace.config. The default location is the root directory of the node project.

The control file takes the form of lines containing command=data.  The '#' character is used for comments.  To turn off tracing just comment out the 'level' command.

The level command is the only command you have to have. The program will list traces with this level or preceding this in the priority list. The default list is [min,norm,verbose,silly]. 
  
The commands are:

* **level**      Trace.log traces if the level in the call is equal or preceding this. 
* **source**     Name of the javascript file to be traced. If omitted the whole system will be traced.
* **lines**      Only trace call between two line numbers. 
* **ip**         Trace is only honoured for requests from that IP. If omitted, any IP will cause the trace to output. 
* **log**        Output to this file. If omitted, output goes to the console.  
* **note**       Anything on this line is listed on the output.
* **priority**   Comma separated list of levels to be used instead of the default list.
* **maxdepth**   The maximum depth to which nested objected should be listed (default 3).
* **linewidth**  Width of line in characters.  The program will attempt to keep short objects on one line.
* **refresh**    Time before refreshing config in minutes (not needed if trace.init is called once per request). 
* **maxstring**  Long strings are runcated to this size before listing. 

   
##   Examples

The minimum control file which results in traces is as follows. If the init() call is not used, the refresh option (below) must be given also. 
```
level=norm
```
To turn traces off simply comment out this line.

This example shows every option. 
```
level=verbose               # comment out to switch traces off. Set to level required.
source=suds-list-table.js   # If omitted from all source files
lines=466,483               # If omitted, from all line numbers
ip=192.168.0.12             # If omitted, transactions from any IP will be traced
log=trace.log               # output to file. If omitted goes to console.
note=Test 36                # Optional note at beginning of trace listing
priority=min,norm,verbose   # Priority list. If omitted assumed [min,norm,verbose,silly]
maxdepth=6                  # Depth of nested onjects to be shown (default 3 but can be over-ridden in call).
linewidth=100               # Number of characters per line. Default 60.  
refresh=1                   # Time before refreshing config in minutes if no 'init()' call
maxstring=500               # Long strings truncated to this size before listing

```


##  Functions 
  
 **trace.init()** - Should be called once per request only.  Reads and processes the the  config file so that changes are recognised.  
 
 It is optional, and if not used, the config file is processed once, then it is re-checked according to the refresh value in the config file (defaulting to 5 minutes). 

 The call is required if the IP filtering feature is used. It is also required if the config file is in a non-standard location.  

 **trace.log()** -  Normal trace call. Place withing the code.

###   trace.init(req,dir)
   
 To be called once per transaction only.  parameters:
1. request object 
2. directory of trace control file

example:

            let trace=require('track-n-trace');
            trace.init(req,'./'); 


###  trace.log(item1,item2,... {items,...,  options})
   
A parameter which is an object may contain options.  
1.   **level:'xxx',** (if omitted 'norm' is assumed)     
2.   **break:'x',**  draws a line of the entered character to help locate the trace in the output.
3.   **maxdepth: n.** changes the maximum depth to which objects are listed for that trace only. 

Anything else is treated as a data item. So {foo:'bar'}  is the same as '\nfoo,:','bar'


###      Examples:  

Normal call. This lists the Javascript filename, line number and elapsed time plus the three data items.  The level is assumed as 'norm'. 
```
        trace.log(tablename,id,title);                                 
```

Putting the data inside an object.  This lists the same data, but the output is nicer.
```
        trace.log ({table: tablename, id:id, title:title });  
```

Adding options.  In this case the tablename and id are just listed as values. The title is inside the object, so the listing is easier to read. The level in this case is changed to 'verbose'.  
```
        trace.log(tablename,id,{title:title, level:'verbose'});     
```
More options
```
        trace.log({start: inputs, level:'min',break:'#', maxdepth: 3});   
```

### Keeping the output focussed

You can get a lot of output from a program trace, but cut this down by:
1. Limit output from one Javascript file
2. Limit the line numbers as well
3. Use the custom priority levels feature creatively. For example, you are processing a large file and having issues with one record - say record key = 3556. Set the level in the traces you are interested in as follows: {level: id} where id is a variable containing the record key. In the config file set the level to 3556 and the priority levels to (say) 'min,3556'. You will get listings from the 'min' level plus your traces only for record 3556. 

##   Output

Parameters are listed once per line.  Entry point, number of seconds since the last refresh plus the level.   Objects are then listed on one line (as above) if it can be done within the line length. If too long the objects are listed with one item per line.  Nested objects are indented. 
 

example:
In code file admin.js:

```
21  let trace = require('track-n-trace');
22  trace.init(req, './');  
    ...
50 let id=10;
51 let table='customers'
52 let title='Customer file';
53 trace.log(id,{table:tablename,title:title, level: 'min'});
```
   
------------------------------------------------------------
```
admin.js:53:11 -> 0.006 seconds - level min  
10
{ table: 'customers', title: 'Customer file', }
```
The entry point is the code file name and line number of the call.
The time is the time since the config was refreshed. 
Note that the output is nicer when the data is inside an object.


