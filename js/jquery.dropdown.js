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
                $(document).click(function() {
                        console.glog("dropdown","document clicked");
                        dd.forEach(function(e) {
                                console.glog("dropdown","collapsing",e);
                                var i=$(".dropdown-items",e);
                                if(e.hasClass("open"))
                                        i.slideUp(500,function() { e.removeClass("open") });
                        });
                });
        }
});
