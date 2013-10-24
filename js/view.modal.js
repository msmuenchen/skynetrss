//SkyRSS modal view
if(typeof appstate!="object")
  appstate={};

jQuery(document).ready(function($){
  $(".modal-close").click(function() {
    console.glog("view.modal","detected click on modal-close button");
    $("#modal-container").hide(); //hide the overlay
    $(this).parent().hide(); //and hide the container the button belongs to
    appstate.keyscope=0;
  });
  //handle escape-key-presses
  $(window).keydown(function(e) {
    if(e.keyCode!=27) //escape
      return;
    
    if($(".modal-close").filter(":visible").length==0) //check if the current modal is active
      return;
    console.glog("view.modal","detected esc-key press");
    $("#modal-container,.modal-box").hide();
    appstate.keyscope=0;
  });
});

$(document).on("skyrss_modal_show",function(e,a) {
  console.glog("view.modal","showing modal with selector",a.id);
  if($("#modal-container").is(":visible")) {
    console.gerror("view.modal","container already visible!");
    return;
  }
  $("#modal-container,"+a.id).show();
  appstate.keyscope=99;
});