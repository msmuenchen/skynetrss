//http://stackoverflow.com/a/4171292/1933738
//Toggle a checkbox
(function ($) {
  $.fn.toggleCheckbox = function() {
    this.attr('checked', !this.attr('checked'));
    this.change();
  }
}(jQuery));
