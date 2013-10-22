//src http://www.codenothing.com/archives/2009/data-selector/

//http://stackoverflow.com/a/15651670
$.fn.filterByData = function(prop, val) {
    return this.filter(
        function() { return $(this).data(prop)==val; }
    );
}
