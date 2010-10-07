var lineheight = 18;
$(function() {
  var $quiz = $("#quiz"),
    $updownbar = $("#updownbar");
  /** If it's a quiz page **/
  if($quiz.length) {
    if (!$updownbar.length) {
      $quiz.animate({width: '+=' + 75});
      /*
    }
    if ($quiz.height() <= $updownbar.height() - lineheight) {
      */
    } else {
      $updownbar.fadeOut(function() {
        $quiz.animate({width: '+=' + 75});
      });
    }
      /*
    } else {
      $quiz.height(
        $updownbar.height() - lineheight
      ).css("overflow", "auto");
    }
  */

    sQuizId = $("#quiz input[name=quizid]").val();
    $allanswerperquestion = $("ol.answers");

    /*
    $("li", $allanswerperquestion).each(function() {
      .has(":checked").addClass("chosen");
    });
    */

      /*
    $("li", $allanswerperquestion)
    */

    $("input[type=text]").focus(function (e) {
      $(e.target).data("original_value" , $(e.target).val());
    });

    $("input", $allanswerperquestion).change(function (e) {
      if($(e.target).is("[type=text]")) {
        if($(e.target).val().length) {
          $(e.target).closest("li").addClass("chosen");
        } else {
          $(e.target).val($(e.target).data("original_value"));
        }
      } else {
        $(e.target).closest("ol").find("li").removeClass("chosen")
          .has(":checked").addClass("chosen");
      }

      $.post(document.location,
      $(e.target).closest(".answers").find("input").serialize() + "&quizid=" + sQuizId, function (data) {
        $(e.target).closest("li").effect("highlight");
      });
    });
  }
  /** Time to add in the scroll to later **/
});
