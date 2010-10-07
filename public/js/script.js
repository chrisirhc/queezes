var lineheight = 18;
$(function() {
  var $quiz = $("#quiz"),
    $updownbar = $("#updownbar"), $quizedit = $("#quizedit");
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
          return;
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
  } else if ($quizedit.length) {
    $("ol.questions") .accordion({
      collapsible: true,
      header: "li[data-item-type=questionOrder] > h3"
    });
    $("ol.questions, ol.questions li ol.answers", $quizedit)
    .sortable({
      containment: "parent",
      opacity: 0.6,
      axis: "y",
      items: "li:not(.open-ended)",
      forcePlaceholderSize: true,
      update: function (event, ui) {
        // console.log(event.target);
        $("> li", event.target).each(function (i, li) {
          var $li = $(li);
          // console.log(li);
          $.post("/" + $li.attr("data-item-type") + "/" + $li.attr("data-order-id"), {_method: "put", weight: i}, function (data) {
            $li.attr("data-weight", i);
            $li.effect("highlight");
          });
        });
      }
    })
    .find("li").each(function (i, li) {
      var $li = $(li);

      var controlsBox = $("<div class='controlsbox'></div>");
      var butEdit = $("<button name='edit' title='Edit' type='button'>E</button>");
      var butAdd = $("<button name='add' title='Add' type='button'>+</button>");
      var butRemove = $("<button name='remove' title='Remove' type='button'>-</button>");

      // var newAnswer = $("<input

      var isopenended;
      // If it's a question
      if($li.is("[data-item-type=questionOrder]")) {
        var bOpen = $("<input type='checkbox' />");

        controlsBox.append($("<label>Open-ended?</label>").prepend(bOpen));
        if($li.is("[data-is-open-ended=true]")) {
          bOpen.attr("checked", "checked");
        }

        bOpen.change(function () {
          console.log($(bOpen).is(":checked"));
          $.post("/question/" + $li.attr("data-question-id"), {_method: "put", open_ended: $(bOpen).is(":checked") ? "true" : "false"}, function () {
            $li.attr("data-is-open-ended", $(bOpen).is(":checked"));
            $li.effect("highlight");
          });
        });
      }
      if(isopenended = !$li.is(".open-ended")) {
        controlsBox.append(butEdit);
      }
      controlsBox.append(butAdd);
      if(isopenended) {
        controlsBox.append(butRemove);
      }
      controlsBox.appendTo(li).hide();

      $li.mouseenter(function() {
        controlsBox.fadeIn();
      });

      $li.mouseleave(function() {
        controlsBox.fadeOut();
      });
    });

    /** can't move open-ended answers **/
    // $("ol.questions li.open-ended").sortable("disable");

    // $quizedit.accordion();
    /** If it's a quiz editing page **/

  }

  /** Time to add in the scroll to later **/
});
