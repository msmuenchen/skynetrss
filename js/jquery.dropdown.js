$.fn.extend({
        dropdown : function() {
                var dd=[];
                this.each(function() {
                        var e=$(this);
                        dd.push(e);
                        var h=$(".dropdown-header",e);
                        var i=$(".dropdown-items",e);
                        h.click(function(ev) {
                                ev.stopPropagation();
                                if(e.hasClass("open"))
                                        i.slideUp(500,function() { e.removeClass("open") });
                                else {
                                        e.addClass("open");
                                        i.slideUp(0);
                                        i.slideDown(500);
                                }
                                
                        });
                });
                if(!$.fn.dropdown.runOnce) {
                $(document).click(function() {
                        console.glog("dropdown","document clicked");
                        dd.forEach(function(e) {
                                var i=$(".dropdown-items",e);
                                if(e.hasClass("open")) {
                                        console.glog("dropdown","collapsing",e);
                                        i.slideUp(500,function() { e.removeClass("open") });
                                }
                        });
                });
                }
                $.fn.dropdown.runOnce=true;
        }
});
