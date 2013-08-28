//http://stackoverflow.com/a/2723677
$.fn.extend({
        disableSelection : function() {
                this.each(function() {
                        this.onselectstart = function() { return false; };
                        this.unselectable = "on";
                        $(this).css('-moz-user-select', 'none');
                        $(this).css('-webkit-user-select', 'none');
                });
        }
});
