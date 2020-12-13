 

Trace
-----
   Trace progress through a program.  Trace statements
   can be added at any point in the code to log important  
   data.  Features:

    Traces can be turned on or off in real time under control  
     of a small text file. You don't need to restart. 

    Traces can be limited to requests from a given
     IP address - so can be used in a live system without  
     interfering with other users transactions.

    Traces can be limited to a one javascript file.
     or the whole system.

    Traces can be sent to the console or a text file.
 
                  Control file
                  -----------
   This is a csv file. Data items are:
  
   Line 1
   ------
   Level -      trace level can be anything as long as frequency 
                is in alphabetical order of level.  Trace.log
                traces if the level in the call is <= 
                level in the control file. Default levels in 
                priority order are: min,norm,verbose,silly
                but these can be changed in the control file.
                

   code file -  Name of the file to be traced. If omitted the 
                system will be traced

  IP address -  Trace only honoured for requests from that IP

  Log File   -  Output to this file. If omitted to the console  

  Line 2
  ------
  Levels     -  On the lext line you can add a list of levels in 
               proprity order. If omitted this is assumed to be
                min,norm,verbose,silly
   
   Examples
   -------
               norm,myprog.js,192.168.0.12,trace.log  
               min,norm,max
               (changes standard levels list/priority)

               mylevel
               mylevel
               (this example only traces one bespoke level)

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

