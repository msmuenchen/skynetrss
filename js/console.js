//skyrss console extender

//first argument is group, rest gets forwarded to console.log
console.glog=function() {
  var grp=arguments[0];
  var args = Array.prototype.slice.call(arguments, 1); //http://stackoverflow.com/a/6808662/1933738
  if(console.group)
    console.group(grp);
  console.log.apply(this,args);
  if(console.group)
    console.groupEnd();
}
