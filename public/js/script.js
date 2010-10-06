var lineheight = 18;
$(function() {
  if ( $("#quiz").height() <= $("#updownbar").height() - lineheight) {
    $("#updownbar").fadeOut();
  } else {
    $("#quiz").height(
      $("#updownbar").height() - lineheight
    ).css("overflow", "auto");
  }
  /** Time to add in the scroll to later **/
});

