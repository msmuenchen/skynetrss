//skyrss console extender

console._glog_lastgroup="";

//first argument is group, rest gets forwarded to console.log
console.glog=function() {
  var grp=arguments[0];
  var args = Array.prototype.slice.call(arguments, 1); //http://stackoverflow.com/a/6808662/1933738
  if(console.group) {
    if(console._glog_lastgroup!=grp) {
      console.groupEnd();
      console._glog_lastgroup=grp;
      console.group(grp);
    }
  }
  console._glog_native_log.apply(this,args);
}

//first argument is group, rest gets forwarded to console.error
console.gerror=function() {
  var grp=arguments[0];
  var args = Array.prototype.slice.call(arguments, 1); //http://stackoverflow.com/a/6808662/1933738
  if(console.group) {
    if(console._glog_lastgroup!=grp) {
      console.groupEnd();
      console._glog_lastgroup=grp;
      console.group(grp);
    }
  }
  console._glog_native_error.apply(this,args);
}

//first argument is group, rest gets forwarded to console.warn
console.gwarn=function() {
  var grp=arguments[0];
  var args = Array.prototype.slice.call(arguments, 1); //http://stackoverflow.com/a/6808662/1933738
  if(console.group) {
    if(console._glog_lastgroup!=grp) {
      console.groupEnd();
      console._glog_lastgroup=grp;
      console.group(grp);
    }
  }
  console._glog_native_warn.apply(this,args);
}

console._glog_native_log=console.log;
console._glog_native_error=console.error;
console._glog_native_warn=console.warn;

console.log=function() {
  var args=arguments;
  Array.prototype.unshift.call(arguments,"UNGROUPED");
  console.glog.apply(this,args);
}

console.error=function() {
  var args=arguments;
  Array.prototype.unshift.call(arguments,"UNGROUPED");
  console.gerror.apply(this,args);
}

console.warn=function() {
  var args=arguments;
  Array.prototype.unshift.call(arguments,"UNGROUPED");
  console.gwarn.apply(this,args);
}
