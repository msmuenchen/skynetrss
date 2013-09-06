//code for the importgr view

//import a google reader takeout OPML file
function importgrfile() {
  //  http://stackoverflow.com/a/4006992
  // AJAX-send a file...
  function shipOff(event) {
    var result = event.target.result;
    var fileName = $("#grfile").get(0).files[0].name;
    $("#importgrfile").attr("disabled","disabled");
    $("#grresult .row").remove();
    $("#grresult-noentries").show();
    
    console.log("Shipping off OPML");
    $.post(appconfig.apiurl+'?action=importgr&feed=0', { data: result, name: fileName }, function(data) {
      console.log("OPML processed");
      console.log(data);
      if(data.status!="ok") {
        alert(sprintf(_("apierror_other"),"importgr"));
        $("#importgrfile").removeAttr("disabled");
        return;
      }
      if(data.invalid!=0) {
        alert(sprintf(_("apierror_other"),"importgr"));
        $("#importgrfile").removeAttr("disabled");
        return;
      }
      var total=data.feeds.length;
      var remaining=total;
      $("#grcounter").show();
      $("#grcounter_total").html(total);
      $("#grcounter_cur").html(remaining);
      $("#grresult-noentries").hide();
      
      $.each(data.feeds,function(idx,e) {
        var tr=$("<tr></tr>").addClass("row").attr("id","grresult-"+idx);
        $("<td></td>").html(idx).appendTo(tr);
        $("<td></td>").addClass("fid").appendTo(tr);
        var lnk=$("<a></a>").attr("target","_blank").attr("href",e).html(e);
        $("<td></td>").append(lnk).appendTo(tr);
        $("<td></td>").addClass("title").appendTo(tr);
        $("<td></td>").addClass("status").html("Lade...").appendTo(tr);
        tr.appendTo($("#grresult"));

        doAPIRequest("add",{feed:e,ignoreAPIException:true},function(data2) {
          remaining--;
          $("#grcounter_cur").html(total-remaining);
          if(remaining<=0)
            $("#importgrfile").removeAttr("disabled");
          if(data2.status!="ok") {
            if(data2.type=="AlreadyPresentException") {
              $("#grresult-"+idx+" .status").html("Bereits in der Liste");
              $("#grresult-"+idx+" .title").html(data2.feed.title);
              $("#grresult-"+idx+" .fid").html(data2.feed.id);
              return;
            }
            var m=data2.type;
            switch(m) {
              case "XMLParseException": m="Ungültiges XML"; break;
              case "FileLoadException": m="Serverproblem"; break;
              default: m="Unbekannter Fehler "+m;
            }
            //if(data2.type!="XMLParseException")
            //  m+="\n"+data2.message;
            $("#grresult-"+idx+" .status").html("Fehler: "+m);
          } else {
            $("#grresult-"+idx+" .title").html(data2.feed.title);
            $("#grresult-"+idx+" .fid").html(data2.feed.id);
            $("#grresult-"+idx+" .status").html("Erfolgreich hinzugefügt");
          }
        });
      });
    });
  }
  var file = $("#grfile").get(0).files[0];
  var reader = new FileReader();
  reader.readAsText(file, 'UTF-8');
  reader.onload = shipOff;
}
