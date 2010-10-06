var lineheight = 18;
$(function() {
  var $quiz = $("#quiz"),
    $updownbar = $("#updownbar");
  if (!$updownbar.length) {
    $quiz.animate({width: '+=' + 75});
  }
  if ($quiz.height() <= $updownbar.height() - lineheight) {
    $updownbar.fadeOut(function() {
      $quiz.animate({width: '+=' + 75});
    });
  } else {
    $quiz.height(
      $updownbar.height() - lineheight
    ).css("overflow", "auto");
  }
  /** Time to add in the scroll to later **/
});
