$.fn.extend({
        dropdown : function() {
                this.each(function() {
                        var e=$(this);
                        var h=$(".dropdown-header",e);
                        var i=$(".dropdown-items",e);
                        h.click(function() {
                                if(e.hasClass("open"))
                                        i.slideUp(500,function() { e.removeClass("open") });
                                else {
                                        e.addClass("open");
                                        i.slideUp(0);
                                        i.slideDown(500);
                                }
                                
                        });
                });
        }
});
