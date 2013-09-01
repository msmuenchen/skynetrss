//Provide API requests with centralized error handling to simplify code
//and support retrying of requests
var APIRequestPool=[];

function doAPIRequest(target,params,success,fail,always) {
  var logstr="";
  var queryUrl=appconfig.apiurl+"?action="+target;
  var reqId=appstate.requestCounter++;
  for(var key in params) {
    logstr+=key+"="+params[key]+",";
    queryUrl+="&"+key+"="+encodeURIComponent(params[key]);
  }
  logstr=logstr.substring(0,logstr.length-1);
  console.log("Submitting request to API "+target+" ("+logstr+") with ID "+reqId+", raw query is "+queryUrl);
  var request=$.getJSON(queryUrl).
    done(function(data) {
      console.log("Request #"+reqId+" to API "+target+" ("+logstr+") returned OK on network level, data object is:");
      console.log(data);
      if(!data.status || (data.status!="ok" && !params.ignoreAPIException)) {
        if(!data.message)
          data.message="";
        console.error("Request #"+reqId+" to API "+target+" ("+logstr+") returned error on API level: '"+data.message+"'");
        //See if the user wants to retry, don't fail silently
        if(confirm(sprintf(appconfig.i18n.apierror_confirm,target)))
          doAPIRequest(target,params,success,fail,always);
        else {
          if(typeof(fail)=="function") {
            console.log("Calling the 'fail' handler of API request #"+reqId);
            fail();
          }
        }
        return;
      }
      if(typeof(success)=="function") {
        console.log("Calling the 'success' handler of API request #"+reqId);
        success(data);
      }
    }).
    fail(function() {
      console.error("Request #"+reqId+" to API "+target+" ("+logstr+") failed on network level");
      if(confirm(sprintf(appconfig.i18n.apierror_confirm,target))) {
        doAPIRequest(target,params,success,fail,always);
        return; //the request may succeed on retry, so return and do not fire the supplied fail-handler
      }
      if(typeof(fail)=="function") {
        console.log("Calling the 'fail' handler of API request #"+reqId);
        fail();
      }
    }).
    always(function(a,b,c) {
      if(typeof(always)=="function") {
        console.log("Calling the 'always' handler of API request #"+reqId);
        always();
      }
      for(var i=0;i<APIRequestPool.length;i++) {
        if(APIRequestPool[i]==c)
          APIRequestPool.splice(i,1);
      }
      $("#poollen").html(APIRequestPool.length);
    });
  APIRequestPool.push(request);
  $("#poollen").html(APIRequestPool.length);
}
