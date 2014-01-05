//Provide API requests with centralized error handling to simplify code
//and support retrying of requests
var APIRequestPool=[];

if(typeof appstate!="object")
  appstate={};
appstate.requestCounter=0;

//when this is set to true, don't whine about API errors
//all requests will be canceled and their error() events fired upon unload!
var isUnloading=false;

window.addEventListener("beforeunload",function() {
  console.log("unloading page!");
  isUnloading=true;
});

//do an API request
//param.ignoreNetworkException=true: do not report to the user that the request failed on network level, but still call s/f/a handlers
//param.ignoreAPIException=true: do not prompt the user for retry of request, still call s/f/a handlers
function doAPIRequest(target,params,success,fail,always) {
  if(appstate.cacheIsOnline==false) {
    console.glog("api","postponing request to "+target+" because appcache is not ready yet (state:"+window.applicationCache.status+")");
    setTimeout(function() {
      doAPIRequest(target,params,success,fail,always);
    },1000);
    return;
  }
  if(appstate.online!=true && (typeof params.ignoreNetworkException=="undefined" || params.ignoreNetworkException!=true)) {
    console.gerror("api","tried to submit a request to "+target+" in offline mode");
    alert("tried to submit an api request while offline?!");
    return;
  }
  var logstr="";
  var queryUrl=appconfig.apiurl+"?action="+target;
  var reqId=appstate.requestCounter++;
  for(var key in params) {
    logstr+=key+"="+params[key]+",";
    queryUrl+="&"+key+"="+encodeURIComponent(params[key]);
  }
  logstr=logstr.substring(0,logstr.length-1);
  console.glog("api","Submitting request to API "+target+" ("+logstr+") with ID "+reqId+", raw query is "+queryUrl);
  var request=$.getJSON(queryUrl).
    done(function(data) {
      console.glog("api","Request #"+reqId+" to API "+target+" ("+logstr+") returned OK on network level, data object is:");
      console.glog("api",data);
      if(!data.status || (data.status!="ok" && !params.ignoreAPIException)) {
        if(!data.message)
          data.message="";
        console.gerror("api","Request #"+reqId+" to API "+target+" ("+logstr+") returned error on API level: '"+data.message+"'");
        //See if the user wants to retry, don't fail silently
        if(confirm(sprintf(_("apierror_confirm"),target)))
          doAPIRequest(target,params,success,fail,always);
        else {
          if(typeof(fail)=="function") {
            console.glog("api","Calling the 'fail' handler of API request #"+reqId);
            fail();
          }
        }
        return;
      }
      if(typeof(success)=="function") {
        console.glog("api","Calling the 'success' handler of API request #"+reqId);
        success(data);
      }
    }).
    fail(function() {
      if(isUnloading) {
        console.gerror("api","Request #"+reqId+" to API "+target+" ("+logstr+") failed because of page unload!");
        return;
      }
      console.gerror("api","Request #"+reqId+" to API "+target+" ("+logstr+") failed on network level");
      if(params.ignoreNetworkException && params.ignoreNetworkException==true) {
        console.glog("api","Not showing failure to user, override specified");
      } else {
        if(confirm(sprintf(_("apierror_confirm"),target))) {
          doAPIRequest(target,params,success,fail,always);
          return; //the request may succeed on retry, so return and do not fire the supplied fail-handler
        }
      }
      if(typeof(fail)=="function") {
        console.glog("api","Calling the 'fail' handler of API request #"+reqId);
        fail();
      }
    }).
    always(function(a,b,c) {
      if(typeof(always)=="function") {
        console.glog("api","Calling the 'always' handler of API request #"+reqId);
        always();
      }
      //Determine if a or c is the XHR object.
      //Why in fucks name has jQuery decided on jqXHR.always(function(data|jqXHR, textStatus, jqXHR|errorThrown) { }); ?!?!
      //If someone knows someone who wrote this, please have someone check his mental health.
      var xhr=(typeof c=="string")?a:c;
      var k=APIRequestPool.indexOf(xhr);
      if(k==-1) {
        console.gerror("api","Request",reqId," has no pool entry!");
        return;
      }
      APIRequestPool.splice(k,1);
      $("#poollen").html(APIRequestPool.length);
    });
  request._url=queryUrl;
  APIRequestPool.push(request);
  $("#poollen").html(APIRequestPool.length);
}

//abort all running API requests
function cancelAllRequests() {
  APIRequestPool.forEach(function(e) {
    e.abort();
  });
}
