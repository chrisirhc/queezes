var lineheight = 18;
$(function() {
  var $quiz = $("#quiz"),
    $updownbar = $("#updownbar");
  if (!$updownbar.length) {
    $quiz.animate({width: '+=' + 65});
  }
  if ($quiz.height() <= $updownbar.height() - lineheight) {
    $updownbar.fadeOut(function() {
      $quiz.animate({width: '+=' + 65});
    });
  } else {
    $quiz.height(
      $updownbar.height() - lineheight
    ).css("overflow", "auto");
  }
  /** Time to add in the scroll to later **/
});
