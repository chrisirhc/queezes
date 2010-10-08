var lineheight = 18;
$(function() {
  var $quiz = $("#quiz"),
    $updownbar = $("#updownbar"), $quizedit = $("#quizedit");
  /** If it's a quiz page **/
  if($quiz.length) {

    var sQuizId = $("#quiz input[name=quizid]").val();
    $allanswerperquestion = $("ol.answers");

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

    var sQuizId = $("#quizedit input[name=quizid]").val();

    $("ol.questions") .accordion({
      collapsible: true,
      header: "li[data-item-type=questionOrder] > h3"
    }).find("> li").each(function(i, obj) {
      // $(obj).click(function(e) {$("ol.questions").accordion("activate", i); });
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

      var isopenended, isquestion;
      // If it's a question
      if(isquestion = $li.is("[data-item-type=questionOrder]")) {
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
      if(!(isopenended = $li.is(".open-ended"))) {
        controlsBox.append(butEdit);
        butEdit.click(function () {
          var currtext;
          if(isquestion) {
            currtext = $li.find("> h3").text();
          } else {
            currtext = $li.find("span").text();
          }
          var newtext = prompt("What would you like the new name to be?", currtext);
          if (newtext) {
            if (isquestion) {
              $.post("/question/", {
                content: newtext,
                open_ended: $li.attr("data-is-open-ended")
              }, function (qObj) {
                $.post("/questionOrder/" + $li.attr("data-order-id"), {
                  _method: "put",
                  question: qObj.id
                }, function (qoObj) {
                  /** Quick hack **/
                  document.location = document.location;
                  /*
                  $li
                  .attr("data-question-id", qObj.id)
                  .find("> h3").text(newtext);
                  $li.find("ol.answers li:not(.open-ended)").remove();
                  */
                });
              });
            } else {
              $.post("/answer/", { content: newtext }, function (aObj) {
                $.post("/answerOrder/" + $li.attr("data-order-id"), {
                  _method: "put",
                  answer: aObj.id
                }, function (aoObj) {
                  $li
                  .attr("data-answer-id", aObj.id)
                  .find("span").text(newtext);
                });
              });
            }
          }
        });
      }
      controlsBox.append(butAdd);
      butAdd.click(function () {
        var newtext;
        var newtext = prompt("What would you like the new item to be?", "");
        if (newtext) {
          if (isquestion) {
            $.post("/question/", {
              content: newtext,
              open_ended: $li.attr("data-is-open-ended")
            }, function (qObj) {
              $.post("/questionOrder/", {
                _method: "post",
                question: qObj.id,
                weight: 1000
              }, function (qoObj) {
                $.post("/linkquizqorder/" + sQuizId + "/" + qoObj.id, {_method: "put"}, function () {
                  /** Quick hack **/
                  document.location = document.location;
                });
              });
            });
          } else {
            $.post("/answer/", { content: newtext }, function (aObj) {
              $.post("/answerOrder/" + $li.attr("data-order-id"), {
                answer: aObj.id,
                weight: 1000
              }, function (aoObj) {
                $.post("/linkquestionaorder/" + $li.closest("[data-item-type=questionOrder]").attr("data-question-id") + "/" + aoObj.id, {_method: "put"}, function () {
                  document.location = document.location;
                });
              });
            });
          }
        }
      });

          if(!isopenended) {
            controlsBox.append(butRemove);
            butRemove.click(function() {
              if (confirm("Are you sure you want to remove this?")) {
                if(isquestion) {
                  $.post("/questionOrder/" + $li.attr("data-order-id"), { _method: "delete" },
                  function () {
                    $li.remove();
                  });
                } else {
                  $.post("/answerOrder/" + $li.attr("data-order-id"), { _method: "delete" },
                  function () {
                    $li.remove();
                  });
                }
              }
            });
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
