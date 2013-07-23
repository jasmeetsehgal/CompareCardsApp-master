$(document).ready(function () {

	amexCompare.init();
	
	$.trace =(function(msg){
		
		if (typeof console == "undefined" || typeof console.log == "undefined"){
		
			if (window.console && 'function' === typeof window.console.log) {
				 window.console.log(msg);
			}else{
				alert(msg);
				}
		
		}else{			
			console.log(msg);
		}
		
		});

});

$.fn.equalHeights = function (px) {
  //$('.builders').children('.clear').hide();
  $(this).each(function () {
    var currentTallest = 0;
    $(this).children().each(function (i) {
      if ($(this).outerHeight() > currentTallest) {
        currentTallest = $(this).outerHeight();
      }
    });
    //if (!px || !Number.prototype.pxToEm) currentTallest = currentTallest.pxToEm(); //use ems unless px is specified
    // for ie6, set height since min-height isn't supported
    if ($('html').hasClass('ie6') || $('html').hasClass('ie7')) {
      if (parseInt(currentTallest) < 160) {
        currentTallest = 162;
      }
      $(this).children().css({ 'height': currentTallest });
    } else {
      $(this).children().css({ 'min-height': currentTallest });
    }
    $(this).addClass('equalHeights');
  });
  return this;
};



var amexCompare = {
  xmlPath: "assets/xml/cards.xml",
  questionXmlPath: "assets/xml/questions.xml",
  cardXml: 0,
  questionXml: 0,
	questionList: [],
  xmlLoaded: 0,
  xmlParsed: 0,
  selectedCard: 0,
  init: function () {
    amexCompare.getCardData();
    amexCompare.getQuestionData();
  },
  alignTooltipBtns: function () {
    $('.card_row').each(function () {
      var ht = $(this).outerHeight();
      var bgHt = ht / 2 - 12;
      var dotHt = ht / 2 - 8;
      $(this).find('.tooltip_btn_bg').css('top', bgHt);
      $(this).find('.tooltip_btn').css('top', dotHt);
    });
  },
  styleRadioButtons: function () {
    $(".q_radios").each(function (index) {
      var selected = 0;
      $(this).find("label").each(function () {
        val = $(this).text() + "_" + index;
        labl = $(this).attr('for');
        rel = $(this).attr('rel');
        $(this).prev().before("<a href='#" + labl + "' rel='" + rel + "' class='radio_styled x' id='" + labl + "'></a>").hide();
      });
      $(this).find("input").each(function () {
        var yesNo = $(this).attr('value');
        var id = $(this).attr('id');
        var number = id.slice(id.lastIndexOf("q") + 1, id.lastIndexOf("_")) - 1;
        if (this.checked) {
          $("#radio_" + yesNo + "_" + number).addClass('selected');
          selected++;
        } else {
          $("#radio_" + yesNo + "_" + number).removeClass('selected');
        }
      });
      $(this).attr("rel", selected);
    });
    // function to 'select' the styled ones and their matching radio buttons
    $(".radio_styled").click(function (evt) {
      		evt.preventDefault();
	 		if (!$(this).nextAll('label').eq(0).hasClass('inactive')) {
				if ($(this).parent().attr("rel") != 0) {
					if ($(this).hasClass("selected")) {
						$(this).removeClass('selected');
						//console.log('add class');
						
					} else {
						$(this).parent().children(".selected").removeClass("selected");
						$(this).toggleClass("selected");
						
					}
					
				} else {
					$(this).toggleClass("selected");
					$(this).parent().attr("rel", "1");
					
				}
				$(this).next("input").trigger("click");	
				
				var selectionID = $(this).attr('id')
				//console.log(selectionID);				
				 $($(this).parent()).find('label').each(function (index) {
					 if($(this).attr("for") === selectionID){
						 
					 }
					//console.log($(this).attr("for") +"--"+ index); 
				 });
	
				 //console.log($($(this).parent()).find('label').attr('for'))
	
				amexCompare.questionCardFiltering(true, this);
				amexCompare.countRemainingCards();
			}

    });

    /*$('.radio_styled').each(function () {
    $(this).click(function () {
    //console.log('filter');
    amexCompare.questionCardFiltering(true, this);
    });
    });*/

  },
  styleCheckboxes: function () {
    $(".check").each(function (index) {
      if ($(this).children("a.check_styled").length == 0) {
        $(this).find("input").before("<a href='#check_" + index + "' class='check_styled' id='check_" + index + "'></a>").hide();
        $(this).find("input").each(function () {
          (this.checked) ? $(this).prev().addClass('checked') : $(this).prev().removeClass('checked');
        });
      }
    });
    // function to 'check' the styled ones and their matching checkboxes
    $(".check_styled").click(function () {
      $(this).toggleClass('checked');
      $(this).next("input").trigger("click");
      return false;
    });
  },
  attachGeneralHandlers: function () {
    // initialize teh back button
    /*$('.back').click(function () {
    window.location.href = "index.html";
    });*/

    // attach handler for rollover that shows the tooltip across the row
    $('.tooltip_btn').hoverIntent(function () {
      $(this).mouseenter();
      var row = $(this).parent();
      var wd = row.height();
      // row.find('.tooltip').height(wd).data('active', true).fadeIn(250);
      row.find('.tooltip').data('active', true).fadeIn(250);
      $(this).css({
        background: '#214a8d'
      });
    }, function () {
    });

    // attach the handler that clears the tooltip across the row
    $('.card_row').mouseleave(function () {
      var tip = $(this).find('.tooltip');
      var tipActive = tip.data('active');
      if (tipActive) {
        tip.fadeOut(250);
        tip.parent().find('.tooltip_btn').animate({
          backgroundColor: '#a5a7aa'
        }, 200);
        tip.data('active', false);
      }
    });

    $('#terms_overlay').overlay({
      mask: {
        color: '#fff',
        loadSpeed: 0,
        opacity: 0.8
      },
      fixed: false
    });
    $('#member_rewards_overlay').overlay({
      mask: {
        color: '#fff',
        loadSpeed: 400,
        opacity: 0.8
      },
      fixed: false,
      onClose: function () {
        $('.member_terms .member_terms_content').hide();
      }
    });

    $('.card_tip .termsLnk').live('click', function (evt) {
      //console.log('terms click');
      evt.preventDefault();

      // get the terms for the card and populate the terms overlay
      if ($('html').hasClass('ie6') && !$('html').hasClass('sq')) {
        var cardData = $(this).parent().parent().parent().data('cardInfo');
      } else {
        var cardData = $(this).parent().parent().parent().data('cardInfo');
      }
      var cardGroup = cardData.cardGroup;
      var cardName = cardData.cardName;
      var card = amexCompare.cardGroups[cardGroup].cards[cardName];
      var terms = card.terms;
      $('.terms_content').html(terms);
      $('#terms_overlay').data('overlay').load();
      $(this).parent().parent().hide();

    });


    // attach the handler that "exposes" the card and shows the card tooltip
    if ($('html').hasClass('ie6') || $('html').hasClass('ie7')) {
      $('.card.populated').hover(function () {
        amexCompare.cardHoverActionOver(this);
      }, function () {
        amexCompare.cardHoverActionOut(this);
      });
    } else {
      $('.card.populated').hoverIntent(function () {
        amexCompare.cardHoverActionOver(this);
      }, function () {
        amexCompare.cardHoverActionOut(this);
      });
    }

    // handler for mouseout in ie6 and ie7
    $('#popUp').mouseleave(function () {


      if ($('html').hasClass('ie6') || $('html').hasClass('ie7')) {
        var cardData = $(this).find('.card').data('cardInfo');
        $(this).find('.card_tip').hide();

        $('#popUp').empty().hide();

      }
    });

    // trigger the click event for the card in ie6 as the content has been moved out of the card div into the popup div
    $('#popUp').click(function (e) {
      $(('#' + $(this).attr('rel'))).trigger("click")
    });


    // handler that adds the select functionality - clicking selects the card and highlights it and adds the current card icon
    $('.card').click(function (e) {

      /* if disabled do nothing */
      if ($(this).is('.disabled') || $(this).is('.notstart') || $(this).is('.lesserValue')) {
        return;
      }
      var clickID = $(this).attr('id');
      /* check here and toggle select unselect */
      if (($(this).find('img').is('.selec'))) {
        /*$(this).find('.selected_border').css('display', 'none');

        $(".cards .card").each(function (i) {
        $(this).find('img').removeClass('selec');
        $(this).find('selected_border').css('display', 'none');
        //$(this).removeClass('disabled');
        $(this).addClass('hover populated');
        });*/
        return;
      }

      // toggle the selection of the cards when clicked
      $(".cards .card").each(function (i) {
        if ($(this).attr('id') == clickID) {

          $(this).find('img').addClass('selec');
          $(this).find('.selected_border').css('display', 'block');
        } else {
          $(this).find('img').removeClass('selec');
          $(this).find('img').addClass('deft');
          //$(this).addClass('disabled');
          $(this).removeClass('hover populated');
          $(this).find('.selected_border').css('display', 'none');
        }
      });

      // store the current card id
      amexCompare.selectedCard = clickID;

      // update the next button functionality
      $('.step2').addClass('active').bind('click.goToQuestions', function () {
        amexCompare.goToQuestions();
      }).show();

      // create the card row for the users card
      var cardData = $(this).data('cardInfo');
      var cardGroup = cardData.cardGroup;
      var cardName = cardData.cardName;
      /*var cardGroup = $(this).parents('.card_row').eq(0).attr('id');*/
      var cardName = $(this).find('.card_tip h2').text().replace(/[^\w]/g, "");
      var card = amexCompare.cardGroups[cardGroup].cards[cardName];
      if (card.cardNameHtml !== undefined) {
        var cardNameH = card.cardNameHtml;
      } else {
        var cardNameH = card.name;
      }

      var cardData = {
        cardId: card.id,
        cardName: cardNameH,
        benefits: card.benefits,
        rewardsFeatures: card.rewardsFeatures,
        annualFee: card.annualFee,
        suppFee: card.suppFee,
        interestRate: card.interestRate,
        cardImageUrl: card.cardImage,
        applyNow: card.applicationForm,
        findOutMore: card.productPage
      };
      $('.card_compare_row.current').remove();
      $('.card_compare_row.hide_own').removeClass('hide_own');
      $('#compareRow_' + card.id).addClass('hide_own');
      var cardOwn = ich.compareCardCurrent(cardData);
      $('#compareCards .header').after(cardOwn);

      var cardInfo = $('.hide_own').data('cardInfo');
      $('#compareCards .card_compare_row.current').data('cardInfo', cardInfo);

      if (cardName == 'AmericanExpressPlatinumCard') {
        var replText = "Annual Fee:<br>$0<br><br>Supplementary<br>Card Fee: $0";
        $('#compareRow_1').addClass('special').find('.annual_fee_col p').html(replText);
        $('#compareRow_1').find('.apply_now').removeClass('apply_now').addClass('phone_number');
        if (!$('#compareRow_1').hasClass('current')) {
          $('#compareRow_1').insertAfter('.card_compare_row.current');
        }
        $('#card_1').addClass('special');
      } else {
        var fee = amexCompare.cardGroups.CreditCards.cards.AmericanExpressPlatinumReserveCreditCard.annualFee;
        var replText = "Annual Fee:<br>" + fee + "<br><br>Supplementary<br>Card Fee: $0";
        $('#compareRow_1').removeClass('special').find('.annual_fee_col p').html(replText);
        $('#compareRow_1').find('.phone_number').addClass('apply_now').removeClass('phone_number');
        if (!$('#compareRow_1').hasClass('current')) {
          $('#compareRow_1').insertAfter('.card_compare_row.current');
        }
        $('#card_1').removeClass('special');
      }

      /* hide cards of lesser value */
      for (var i = 0; i < card.hideCards.length; i++) {
        $('#compareRow_' + card.hideCards[i]).addClass('lesserValue');
      }
    });

    // attach the handler that shows the question info
    $('.question_tip').hoverIntent(function () {
      $(this).next().show();
      $(this).css('backgroundPosition', 'top left');
    }, function () {
      $(this).next().hide();
      $(this).css('backgroundPosition', 'bottom left');
    });

    // attach the handler that collapses and opens the questions
    $('.questions h2').click(function () {
      if ($('.q_cont:visible').length > 0) {
        $(this).removeClass('open');
        $(this).text('Show questions');
        var htmlv = $('html').attr('class');
        if ((htmlv === 'ie7') || (htmlv === 'ie8')) {
          $(this).next('.q_cont').css('display', 'none');
        } else {
          $(this).next('.q_cont').slideUp();
        }
      } else {
        $(this).addClass('open');
        $(this).text('Questions');
        var htmlv = $('html').attr('class');
        if ((htmlv === 'ie7') || (htmlv === 'ie8')) {
          $(this).next('.q_cont').css('display', 'block');
        } else {
          $(this).next('.q_cont').slideDown();
        }
      }
    });

    $('.question .q_radios label').click(function () {
      var f = $(this).attr('for');
      $(this).parent().find('#' + f).click();
    });

    // attach the handler that collapses and opens the card compare row
    $('.card_compare_row h2').live('click', function () {
      if ($(this).parent().find('.card_cols:visible').length > 0) {
        $(this).removeClass('open');
        $(this).next('.card_cols').slideUp();
        var currentView = $('.pages.active').attr('rel');
        if (currentView == undefined) {
          currentView = 'compare_shortlist';
        }
        $(this).parent().data(currentView, false);
      } else {
        $(this).addClass('open');
        $(this).next('.card_cols').slideDown();
        var currentView = $('.pages.active').attr('rel');
        if (currentView == undefined) {
          currentView = 'compare_shortlist';
        }
        $(this).parent().data(currentView, true);
      }

    });

    // position the shortlist at bottom of window
    amexCompare.shortlistPos();
    $(window).resize(function () {
      amexCompare.shortlistPos();
      if ($('.s_cont:visible').length > 0) {
        $('.shortlist').css({
          top: $('.shortlist').data('openPos')
        });
      } else {
        $('.shortlist').css({
          top: $('.shortlist').data('closedPos')
        });
      }
    });

    // attach the handler that collapses and opens the shortlist
    $('.shortlist h2').click(function () {
      if ($('.s_cont:visible').length > 0) {
        amexCompare.closeShortlist(this);
      } else {
        amexCompare.openShortlist(this);
      }
    });

    $('.shortlist .scrollable').scrollable({
      next: '.forward',
      onSeek: function () {
        var index = this.getIndex();
        var size = this.getSize();
        //console.log(index, size);
        if (index == 0) {
          $('.prev').addClass('disabled');
        }
        if (index == 0 && size > 6) {
          $('.prev:visible').addClass('disabled');
          $('.forward').removeClass('disabled');
        }
        if ((size > 6) && (size - 6 == index)) {
          $('.forward:visible').addClass('disabled');
          $('.prev').removeClass('disabled');
        }
        if ((size > 6) && (size - 6 > index)) {
          $('.forward').removeClass('disabled');
        }
      }
      /*onAddItem: function () {
      $('.shortlist .next').removeClass('disabled');
      }*/
    });

    // attach the handler that shows the terms on the member rewards overlay
    $('.member_terms h3 a').unbind().click(function (evt) {
      evt.preventDefault();
      $('.member_terms .member_terms_content').slideToggle();
    });

  },

  closeShortlist: function (that) {
    $(that).removeClass('open');
    $(that).next('.s_cont').slideUp();
    $('.shortlist').animate({
      top: $('.shortlist').data('closedPos')
    });

  },
  openShortlist: function (that) {
    $(that).addClass('open');
    $(that).next('.s_cont').slideDown();
    $('.shortlist').animate({
      top: $('.shortlist').data('openPos')
    }, function () {
      if ($('html').hasClass('ie6')) {
        var top = parseInt($('.shortlist').css('top'));
        $('.shortlist').css('top', top - 4);
      }
    });
  },
  cardHoverActionOver: function (that) {
    /* if disabled do nothing */
    if ($(that).is('.disabled') || $(that).is('.lesserValue')) {
      return;
    }


    // fix for ie6 and ie7 z-index problems
    if ($('html').hasClass('ie6') || $('html').hasClass('ie7')) {
      var cardData = $(that).data('cardInfo');
      var pos = $(that).offset();
      $('#popUp').empty();
      $('#popUp').attr('rel', $(that).attr('id'));
      var htmldata = $(that).html();
      $('#popUp').append(htmldata);
      $('#popUp').data('cardInfo', cardData);



      $('#popUp').css({
        'z-index': '9999',
        'top': pos.top - 5,
        'left': pos.left - 4
      });
      $('#popUp').find('img').css({
        'width': 110,
        'height': 76,
        'top': 0,
        'left': 0
      });
      /*$('#popUp').find('img').animate({
      width: 140,
      height: 88,
      top: -10,
      left: -18
      }, 250).expose({
      loadSpeed: 0,
      closeSpeed: 0
      });
      */
      $('#popUp').css('display', 'block');
      $('#popUp').find('.card_tip').css('display', 'block');
      return;
    }

    // handler for proper browsers
    /*$(this).find('img').animate({
    width: 140,
    height: 88,
    top: -10,
    left: -18
    }, 150).end().expose({
    loadSpeed: 0,
    closeSpeed: 0
    });*/

    // show the card tooltip
    $(that).find('.card_tip').show();

  },
	

  cardHoverActionOut: function (that) {
    // mouseout handler

    // if ie6/7 use the popup mouseleave handler below
    if ($('html').hasClass('ie6') || $('html').hasClass('ie7')) {
      return;
    }
    // hide the tooltip
    $(that).find('.card_tip').hide();

    // animate the card back down
    /*if (!($(this).find('img').is('.selec'))) {
    $(this).find('img').animate({
    height: 67,
    width: 104,
    top: 0,
    left: 0
    }, 150);
    } else {
    $(this).find('img').animate({
    height: 75,
    width: 110,
    top: -5,
    left: -4
    }, 150);

    }*/

    //remove mask
    //$.mask.close();

  },

  shortlistPos: function () {
    var wHt = $(window).height();
    var wWd = $(window).width();
    if ($('html').hasClass('ie6')) {
      var wHt = wHt + 17;
    }
    $('.shortlist').css({
      'top': wHt - 31,
      'width': wWd,
      'position': 'fixed'
    }).data({
      'openPos': wHt - 105,
      'closedPos': wHt - 31
    });
  },

  shortlist: [],

  // attach shortlist funtionality
  setupShortlistHandlers: function () {
    $('.add_to_shortlist').click(function (e) {
      e.preventDefault();
      var name = $(this).parents('.card_compare_row').find('h2').text();
      var id = $(this).parents('.card_compare_row').attr('id');
      var src = $(this).siblings('img').eq(0).attr('src');
      var s = {
        cardImageUrl: src,
        cardName: name,
        cardId: id
      }
      amexCompare.shortlist.push(id);

      var s_item = ich.shortlist_card(s);
      //$('.shortlist .scrollable .items').append(s_item);
      $('.shortlist .scrollable').data('scrollable').addItem(s_item);
      var itms = $('.shortlist .scrollable').data('scrollable').getSize();
      if (itms > 6) {
        //$('.forward, .prev').removeClass('disabled');
        $('.shortlist .scrollable').data('scrollable').move(1);
      }
      if ($('.s_cont:visible').length == 0) {
        $('.shortlist h2').addClass('open');
        $('.shortlist h2').next('.s_cont').slideDown();
        $('.shortlist').animate({
          top: $('.shortlist').data('openPos')
        }, function () {
          if ($('html').hasClass('ie6')) {
            var top = parseInt($('.shortlist').css('top'));
            $('.shortlist').css('top', top - 4);
          }
        });
      }

    });
    $('.shortlist .remove').live('click', function () {
      var row = $(this).parent().attr('id').substring(10);
      //console.log(row);

      for (var i = amexCompare.shortlist.length - 1; i >= 0; i--) {
        if (amexCompare.shortlist[i] === row) {
          amexCompare.shortlist.splice(i, 1);
        }
      }
      $(this).parent().remove();
      //amexCompare.shortlist[id] = {};
      var itms = $('.shortlist .scrollable').data('scrollable').getSize();
      if (itms <= 6) {
        $('.forward, .prev').addClass('disabled');
        $('.shortlist .scrollable').data('scrollable').move(-1);
      }
    });

    // attach shortlist comparison button handler
    $('.compare_shortlist').click(function () {
      amexCompare.compareShortlistedCards();
    });
  },

  // function that compares the Shortlisted Cards
  compareShortlistedCards: function () {
    $('.card_compare_row').hide();
    $('.pages.active').removeClass('active');
    $('.compare_shortlist').addClass('active');
    $('.card_compare_row.current').show();
    // hide cards of lesser value
    amexCompare.hideLesserValueCards();

    for (var i = 0; i < amexCompare.shortlist.length; i++) {
      var id = amexCompare.shortlist[i];
      $('#' + id).show();
    }
    $('.card_compare_row:visible').each(function () {
      var show = $(this).data('compare_shortlist');
      //console.log(show);
      if (show != undefined) {
        if (show) {
          $(this).find('.card_cols').show();
        } else {
          $(this).find('.card_cols').hide();
        }
      } else {
        $(this).find('.card_cols').show();
      }
    });
  },


  // function that compares recommended cards
  compareRecCards: function () {
    amexCompare.questionCardFiltering(false);
    $('.pages').removeClass('active');
    $('.compare_shortlist').removeClass('active');
    $('.compare_rec_cards').addClass('active');
    // hide cards of lesser value
    amexCompare.hideLesserValueCards();
    $('.card_compare_row:visible').each(function () {
      var show = $(this).data('compare_rec_cards');
      //console.log(show);
      if (show != undefined) {
        if (show) {
          $(this).find('.card_cols').show();
        } else {
          $(this).find('.card_cols').hide();
        }
      } else {
        $(this).find('.card_cols').show();
      }
    });
  },

  // function that simulates changing page from questions to compare
  goToCompare: function () {
    $('#popUp').mouseleave();
    $('.instructions').hide();
    $('.instructions.three').show()
    $('.shortlist').show();
    $('.main .compare_cards').css('display', 'block');
    $('.card_compare_row .card_cols:visible').not('.equalHeights').equalHeights();
    $('.main .content, .main .questions .q_cont').hide();

    /*$('.selec').toggleClass('selec current')
    .prev('.selected_border').hide().end()
    .parent().find('.current_icon').show();*/
    $('.step2, .step3').hide();
    $('.back').hide();
    $('.pages').show();
    $('.start_again').bind('click.getStarted', function (e) {
      e.preventDefault();
      amexCompare.goToStart(true);
    });
    $('.compare_rec_cards').bind('click.compareRecCards', function (e) {
      e.preventDefault();
      amexCompare.compareRecCards();
    });
    $('.compare_rec_cards').addClass('active');
    $('.compare_all_cards').bind('click.compareAllCards', function (e) {
      e.preventDefault();
      $('.card_compare_row').show();
      $('.pages.active').removeClass('active');
      $('.compare_shortlist').removeClass('active');
      $('.compare_all_cards').addClass('active');
      /*$('.card_compare_row:visible').each(function () {
      var show = $(this).data('compare_all_cards');
      //console.log(show);
      if (show != undefined) {
      if (show) {
      $(this).find('.card_cols').css('display', 'block');
      } else {
      $(this).find('.card_cols').css('display', 'none');
      }
      } else {
      $(this).find('.card_cols').css('display', 'block');
      }
      });*/
      $('.card_compare_row').removeClass('lesserValue').show();
      $('.card_compare_row .card_cols:visible').not('.equalHeights').equalHeights();
    });
    $('.membership_rewards').unbind().click(function () {
      var id = $(this).attr('rel');
      $(id).data('overlay').load();
    });
    $('.conditions').click(function () {
      var cardData = $(this).parents('.card_compare_row').data('cardInfo');
      var cardGroup = cardData.cardGroup;
      var cardName = cardData.cardName;
      var card = amexCompare.cardGroups[cardGroup].cards[cardName];
      var terms = card.termsFull;
      $('.terms_content').html(terms);
      $('#terms_overlay').data('overlay').load();
    });
  },


  // function that simulates changing page from selecting card to the questions
  goToQuestions: function () {
    $('#popUp').mouseleave();
    $('.instructions').hide();
    $('.instructions.two').show();
    $('.main .content, .main .questions, .questions .q_cont').show();
    $('.shortlist').hide();
    $('.card').removeClass('disabled').addClass('notstart');
    $('.selec').toggleClass('selec current')
      .prev('.selected_border').hide().end()
      .parent().find('.current_icon').show();
    $('.step3').removeClass('active').unbind().show();
    $('.step2').removeClass('active').unbind().hide();

    /*.bind('click.goToCompare', function () {
    amexCompare.goToCompare();
    });*/
    $('.back').show().unbind('click').bind('click.goToStart', function (e) {
      e.preventDefault();
      amexCompare.goToStart(true);
    });

    // hide cards of lesser value
    amexCompare.hideLesserValueCards();
		amexCompare.countRemainingCards();
  },

  hideLesserValueCards: function () {
    amexCompare.lesserValueFilterCounts = {};
    // hide cards of lesser value
    var cardData = $('img.current').parent().data('cardInfo');
    var cardGroup = cardData.cardGroup;
    var cardName = cardData.cardName;
    /*var cardGroup = $('img.current').parents('.card_row').eq(0).attr('id');
    var cardName = $('img.current').parent().find('.card_tip h2').text().replace(/[^\w]/g, "");*/
    var card = amexCompare.cardGroups[cardGroup].cards[cardName];
    for (var i = 0; i < card.hideCards.length; i++) {
      $('#card_' + card.hideCards[i]).addClass('lesserValue');
			amexCompare.lesserValueFilterCount(card.hideCards[i]);
      //$('#compareRow_' + card.hideCards[i]).addClass('lesserValue');
    }
  },
	
	lesserValueFilterCounts: {},
	
	lesserValueFilterCount: function (cardNo) {
		var cardInfo = $('#card_' + cardNo).data('cardInfo');
		var card = amexCompare.cardGroups[cardInfo.cardGroup].cards[cardInfo.cardName]; 
		//console.log(cardInfo.cardName);
		for (var i = 0; i < amexCompare.questionList.length; i++) {
			for (var k=0; k < amexCompare.questionList[i].length; k++) {
				if (card[amexCompare.questionList[i][k]] === 'true') {
					if (amexCompare.lesserValueFilterCounts[amexCompare.questionList[i][k]] === undefined) {
						amexCompare.lesserValueFilterCounts[amexCompare.questionList[i][k]] = [];
						amexCompare.lesserValueFilterCounts[amexCompare.questionList[i][k]].push(cardInfo.cardName);
					} else {
						amexCompare.lesserValueFilterCounts[amexCompare.questionList[i][k]].push(cardInfo.cardName);
					}
				}
			}
		}
	},


  // function that simulates changing page to the card selection page
  goToStart: function (refresh) {
    $('.instructions').hide();
    $('.instructions.one').show()
    $('.main .questions').hide().find('.radio_styled').removeClass('selected');

    //close shortlist so it starts closed when we go back to that page
    amexCompare.closeShortlist($('.shortlist h2')[0]);

    $('.shortlist').hide();
    $('.shortlist .remove').click();
    $('.pages.active').removeClass('active');
    $('.compare_shortlist').removeClass('active');
    $('.card').removeClass('notstart lesserValue');
    $('.compare_cards').hide();
    $('.card_compare_row').show();
    $('.card_compare_row .card_cols:not(:visible)').show();
    amexCompare.questionsFilter.length = 0;
    $('.card_compare_row.current').remove();
    $('.card_compare_row.hide_own').removeClass('hide_own');
    $('.card_compare_row.lesserValue').removeClass('lesserValue');
    $('.current_icon').hide();
    $('.main .content').show();
    $('img.current').removeClass('current').attr('style', '');
    $('.pages').hide();
    if (refresh) {
      $('.step2').removeClass('active').unbind().show();
      amexCompare.selectedCard = 0;
      $('.card').removeClass('disabled');
    } else {
      $('.step2').removeClass('active').unbind().show();
    }
    $('.step3').removeClass('active').unbind().hide();
    $('.back').unbind('click').show();
		amexCompare.lesserValueFilterCounts = {};
  },


  // ajax call to get the data xml and pass it to the function that parses the data
  getCardData: function () {
    $.ajax({
      url: amexCompare.xmlPath,
      dataType: 'xml',
      success: function (xml) {
        amexCompare.cardXml = xml;
        amexCompare.xmlLoaded += 1;
        amexCompare.parseXml();
      },
      error: function (obj, status, error) {
        //console.log('error loading file' + obj);
        alert(error);
      }
    });
  },

  // object that holds the card data
  cardGroups: {
},

// function that parse the xml card data into JSON object
/**** JSON object format is:
cardGroups: { 
groups: { // one object for each group of cards
cards: {
card: { // one object for each card in group
acceleratedPionts: str, //true/false
annualFee: str, // number
applicationForm: str, // url
benefits: str, // html fragment
business: str, //true/false
cardImage: str, //url
charge: str, //true/false
credit: str, //true/false
flyPartnerQantas: str, //true/false
flyPartnerOther: str, //true/false
hideCards: array, // of id numbers
id: str, // number
interestRate: str, // number
name: str,
personal:str, 
rewards: str, //true/false
rewardsFeatures:
suppFee: str,
terms: str, // html fragment
topFeatures: str, // html fragment
travel: str, //true/false
}
},
groupDescription: str, // html fragment
name: str
}
}
*/


parseXml: function () {
  var cardGroups = amexCompare.cardXml.getElementsByTagName('card-group');
  for (var i = 0; i < cardGroups.length; i++) {
    var groupName = cardGroups[i].getAttribute('name');
    var compactGroupName = groupName.replace(/[^\w]/g, "");
    amexCompare.cardGroups[compactGroupName] = {};
    amexCompare.cardGroups[compactGroupName].name = groupName;
    var groupDescription = cardGroups[i].getElementsByTagName('group-description')[0].firstChild.nodeValue;
    amexCompare.cardGroups[compactGroupName].groupDescription = groupDescription;
    var cards = cardGroups[i].getElementsByTagName('card');
    amexCompare.cardGroups[compactGroupName].cards = {};
    for (var j = 0; j < cards.length; j++) {
      var cardName = cards[j].getAttribute('name');
      var compactCardName = cardName.replace(/[^\w]/g, "");
      amexCompare.cardGroups[compactGroupName].cards[compactCardName] = {};
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].name = cardName;
      //console.log(cards[j].getElementsByTagName('card-name')[0]);
      var cNH = cards[j].getElementsByTagName('card-name');
      if (cNH.length > 0) {
        var cardNameHtml = cards[j].getElementsByTagName('card-name')[0].firstChild.nodeValue;
        amexCompare.cardGroups[compactGroupName].cards[compactCardName].cardNameHtml = cardNameHtml;
      }
      var cardId = cards[j].getAttribute('id');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].id = cardId;
      var cardImageUrl = cards[j].getElementsByTagName('card-image')[0].getAttribute('url');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].cardImage = cardImageUrl;
      var topFeatures = cards[j].getElementsByTagName('top-features')[0].firstChild.nodeValue;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].topFeatures = topFeatures;
      var benefits = cards[j].getElementsByTagName('benefits')[0].firstChild.nodeValue;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].benefits = benefits;
      var rewardsFeatures = cards[j].getElementsByTagName('rewards-features')[0].firstChild.nodeValue;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].rewardsFeatures = rewardsFeatures;
      var interestRate = cards[j].getElementsByTagName('interest-rate')[0].firstChild.nodeValue;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].interestRate = interestRate;
      var annualFee = cards[j].getElementsByTagName('annual-fee')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].annualFee = annualFee;
      var suppFee = cards[j].getElementsByTagName('supp-fee')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].suppFee = suppFee;
      var applicationForm = cards[j].getElementsByTagName('application-form')[0].getAttribute('url');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].applicationForm = applicationForm;
      var productPage = cards[j].getElementsByTagName('product-page')[0].getAttribute('url');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].productPage = productPage;
      var terms = cards[j].getElementsByTagName('terms')[0].firstChild.nodeValue;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].terms = terms;
      var termsFull = cards[j].getElementsByTagName('terms-full')[0].firstChild.nodeValue;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].termsFull = termsFull;
      if (cards[j].getElementsByTagName('hide-cards')[0].getAttribute('id-list') !== null) {
        var hideCards = cards[j].getElementsByTagName('hide-cards')[0].getAttribute('id-list').split(',');
      } else {
        var hideCards = [];
      }
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].hideCards = hideCards;
      var business = cards[j].getElementsByTagName('business')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].business = business;
      var personal = cards[j].getElementsByTagName('personal')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].personal = personal;
      var charge = cards[j].getElementsByTagName('charge')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].charge = charge;
      var credit = cards[j].getElementsByTagName('credit')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].credit = credit;
      var travel = cards[j].getElementsByTagName('travel')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].travel = travel;
      var rewards = cards[j].getElementsByTagName('rewards')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].rewards = rewards;
      var flyPartnerQantas = cards[j].getElementsByTagName('fly-partner-qantas')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].flyPartnerQantas = flyPartnerQantas;
      var flyPartnerOther = cards[j].getElementsByTagName('fly-partner-other')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].flyPartnerOther = flyPartnerOther;
      var accelerated = cards[j].getElementsByTagName('accelerated-points')[0].getAttribute('value');
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].accelerated = accelerated;
      amexCompare.cardGroups[compactGroupName].cards[compactCardName].anyrate = "true";
    }
  }
  var memberRewards = amexCompare.cardXml.getElementsByTagName('member-rewards');
  var mTerms = memberRewards[0].getElementsByTagName('terms')[0].firstChild.nodeValue;
  amexCompare.memberTerms = mTerms;
  $('#member_rewards_overlay .member_terms_content').append(mTerms);
  amexCompare.generateCardRows();
  amexCompare.generateCardCompareRows();

},

// generate the html for the card selection rows
generateCardRows: function () {
  for (key in amexCompare.cardGroups) {
    if (amexCompare.cardGroups.hasOwnProperty(key)) {
      var cards = amexCompare.cardGroups[key].cards;
      var cardGroupData = {
        groupId: key,
        groupName: amexCompare.cardGroups[key].name,
        groupDescription: amexCompare.cardGroups[key].groupDescription
      };
      var cardGroup = ich.cardRow(cardGroupData);
      $('#cardGroups').append(cardGroup);
      var cardCount = 0;
      for (cardKey in cards) {
        if (cards.hasOwnProperty(cardKey)) {
          if ($('html').hasClass('ie6')) {
            var cardImageUrl = cards[cardKey].cardImage.replace(".png", ".gif");
          } else {
            var cardImageUrl = cards[cardKey].cardImage;
          }
          if (cards[cardKey].cardNameHtml !== undefined) {
            var cardName = cards[cardKey].cardNameHtml;
          } else {
            var cardName = cards[cardKey].name;
          }

          var cardData = {
            cardId: cards[cardKey].id,
            cardName: cardName,
            topFeatures: cards[cardKey].topFeatures,
            cardImageUrl: cardImageUrl
          };
          var card = ich.card(cardData);

          //$(card).css('zIndex', 9997 - cardCount);
          cardCount += 1;
          $('#' + key + ' .cards').append(card);
          $(card).data('cardInfo', {
            cardGroup: key,
            cardName: cardKey
          });

          // duplicate the data onto the card tip for IE's benefit
          /*var cardData = $(this).data('cardInfo');
          $(card).find('.card_tip').data('cardInfo', {
          cardGroup: key,
          cardName: cardKey
          });*/
        }
      }
      /* added by jasmeet*/
      var loopCount = 5 - cardCount;
      for (i = 0; i < loopCount; i++) {
        if (cards.hasOwnProperty(cardKey)) {
          var cardData = {

        };
        var card = ich.dummyCard(cardData);
        $('#' + key + ' .cards').append(card);
      }
    }
    /* *******  */
  }
}
amexCompare.xmlParsed += 1;
amexCompare.initializeHandlers();
},

// generate the html for the card comparison rows
generateCardCompareRows: function () {
  for (key in amexCompare.cardGroups) {
    if (amexCompare.cardGroups.hasOwnProperty(key)) {
      var cards = amexCompare.cardGroups[key].cards;
      for (cardKey in cards) {
        if ($('html').hasClass('ie6')) {
          var cardImageUrl = cards[cardKey].cardImage.replace(".png", ".gif");
        } else {
          var cardImageUrl = cards[cardKey].cardImage;
        }
        if (cards[cardKey].cardNameHtml !== undefined) {
          var cardName = cards[cardKey].cardNameHtml;
        } else {
          var cardName = cards[cardKey].name;
        }
        var cardData = {
          cardId: cards[cardKey].id,
          cardName: cardName,
          benefits: cards[cardKey].benefits,
          rewardsFeatures: cards[cardKey].rewardsFeatures,
          annualFee: cards[cardKey].annualFee,
          suppFee: cards[cardKey].suppFee,
          interestRate: cards[cardKey].interestRate,
          cardImageUrl: cardImageUrl,
          applyNow: cards[cardKey].applicationForm,
          findOutMore: cards[cardKey].productPage
        };
        var card = ich.compareCard(cardData);
        $('#compareCards').append(card);
        $(card).data('cardInfo', {
          cardGroup: key,
          cardName: cardKey
        });
      }
    }
  }
  amexCompare.xmlParsed += 1;
  amexCompare.initializeHandlers();
},


// ajax call to get the question xml and pass it to the function that parses the data
getQuestionData: function () {
  $.ajax({
    url: amexCompare.questionXmlPath,
    dataType: 'xml',
    success: function (xml) {
      amexCompare.questionXml = xml;
      amexCompare.xmlLoaded += 1;
      amexCompare.parseQXml();
    },
    error: function (obj, status, error) {
      console.log('error loading file' + obj);
    }
  });
},

// object that holds the question data
questions: {
},
numQuestions: 0,
questionsFilter: [],

// function that parse the xml into JSON object
parseQXml: function () {
  var questions = amexCompare.questionXml.getElementsByTagName('question');
  amexCompare.numQuestions = questions.length;
  for (var i = 0; i < questions.length; i++) {
    var questionId = questions[i].getAttribute('id');
    var questionName = "question" + questionId;
    amexCompare.questions[questionName] = {};
    amexCompare.questions[questionName].id = questionId;
    var txt = unescape(questions[i].getElementsByTagName('text')[0].getAttribute('value'));
    amexCompare.questions[questionName].text = txt;
    var answerA = questions[i].getElementsByTagName('answer-a')[0].getAttribute('value');
    amexCompare.questions[questionName].answerA = answerA;
    var responseA = questions[i].getElementsByTagName('response-a')[0].getAttribute('value');
    amexCompare.questions[questionName].responseA = responseA;
    var answerB = questions[i].getElementsByTagName('answer-b')[0].getAttribute('value');
    amexCompare.questions[questionName].answerB = answerB;
    var responseB = questions[i].getElementsByTagName('response-b')[0].getAttribute('value');
    amexCompare.questions[questionName].responseB = responseB;
    var descriptionA = questions[i].getElementsByTagName('description-a')[0].getAttribute('value');
    amexCompare.questions[questionName].descriptionA = descriptionA;
    var descriptionB = questions[i].getElementsByTagName('description-b')[0].getAttribute('value');
    amexCompare.questions[questionName].descriptionB = descriptionB;
  }
  amexCompare.generateQuestions();
},

generateQuestions: function () {
  for (key in amexCompare.questions) {
    if (amexCompare.questions.hasOwnProperty(key)) {
      var questionData = {
        id: amexCompare.questions[key].id,
        text: amexCompare.questions[key].text,
        answerA: amexCompare.questions[key].answerA,
        responseA: amexCompare.questions[key].responseA,
        answerB: amexCompare.questions[key].answerB,
        responseB: amexCompare.questions[key].responseB,
        descriptionA: amexCompare.questions[key].descriptionA,
        descriptionB: amexCompare.questions[key].descriptionB
      };
			//var tempArray = [amexCompare.questions[key].responseA, amexCompare.questions[key].responseB]
			amexCompare.questionList.push(amexCompare.questions[key].responseA, amexCompare.questions[key].responseB);
      var questions = ich.question(questionData);
      $('#questions .q_cont').append(questions);
    }
  }
  amexCompare.xmlParsed += 1;
  amexCompare.initializeHandlers();
},


/*amexCompare.questionsFilter.length = 0;
$('.q_radios input:checked').each(function () {
amexCompare.questionsFilter.push($(this).attr('rel'));
});
for (key in amexCompare.cardGroups) {
if (amexCompare.cardGroups.hasOwnProperty(key)) {
var cards = amexCompare.cardGroups[key].cards;
for (cardKey in cards) {
if (cards.hasOwnProperty(cardKey)) {
var noMatch = false;
for (var i = 0; i < amexCompare.questionsFilter.length; i++) {
var filter = amexCompare.questionsFilter[i];
//console.log(filter);
if (cards[cardKey][filter] === "true") {
var id = cards[cardKey].id;
$('#card_' + id).removeClass('disabled');
$('#compareRow_' + id).show();
} else {
noMatch = true;
}
}
if (noMatch) {
var id = cards[cardKey].id;
$('#card_' + id).addClass('disabled');
$('#compareRow_' + id).hide();
}
}
}
}
}*/




// logic for hiding an showing the cards according to question answers
questionCardFiltering: function (click, radio) {
  //console.log('filter');
  if (click) {
    if ($('.q_radios .radio_styled.selected').length > 0) {
      $('.step3').addClass('active').unbind()
        .bind('click.goToCompare', function () {
          amexCompare.goToCompare();
        });
    } else {
      $('.step3').removeClass('active').unbind();
    }
  } else {
    if ($('.q_radios .radio_styled.selected').length == 0) {
      $('.card_compare_row').show();
      $('.card').removeClass('disabled');
      return;
    }
  }
  amexCompare.questionsFilter.length = 0;
  $('.q_radios .radio_styled.selected').each(function () {
    amexCompare.questionsFilter.push($(this).attr('rel'));
  });

  if (amexCompare.questionsFilter.length > 0) {

    for (key in amexCompare.cardGroups) {
      if (amexCompare.cardGroups.hasOwnProperty(key)) {
        var cards = amexCompare.cardGroups[key].cards;
        for (cardKey in cards) {
          if (cards.hasOwnProperty(cardKey)) {
            var noMatch = false;
            for (var i = 0; i < amexCompare.questionsFilter.length; i++) {
              var filter = amexCompare.questionsFilter[i];
              //console.log(filter);
              if (cards[cardKey][filter] === "true") {
                var id = cards[cardKey].id;
                $('#card_' + id).removeClass('disabled');
                $('#compareRow_' + id).show();
              } else {
                noMatch = true;
              }
            }
            if (noMatch) {
              var id = cards[cardKey].id;
              if (!$('#compareRow_' + id).hasClass('special')) {
                $('#card_' + id).addClass('disabled');
              }
              if (!($('#compareRow_' + id).hasClass('current') || $('#compareRow_' + id).hasClass('special'))) {
                $('#compareRow_' + id).hide();
              }
            }
          }
        }
      }
    }
  } else {
    $('.card').removeClass('disabled');
    $('.card_compare_row').show();
  }
  $('.card_compare_row .card_cols:visible').not('.equalHeights').equalHeights();
},
getOtherCardName:function(cardName){
	for (var j=0; j < amexCompare.questionList.length; j++) {
		//console.log(amexCompare.questionList[j] +" -- "+ cardName)
		if(amexCompare.questionList[j] === cardName){
			if(j%2 == 0){
				return amexCompare.questionList[j+1];
			}else{
				return amexCompare.questionList[j-1];
			}
		}
	}
},
countRemainingCards: function () {
	for (var j=0; j < amexCompare.questionList.length; j++) {
		var question = amexCompare.questionList[j];
		var matchingCards = 0;
		var matchedCard = false;
		if(String(amexCompare.questionsFilter).indexOf(question) > -1){
			continue;
			}
		$('.card').not('.lesserValue, .disabled').each(function () {
			var card = $(this).data('cardInfo');			
			if (amexCompare.cardGroups[card.cardGroup].cards[card.cardName][question] === "true") {
				//matchedCard = true;
				matchingCards++;
			}
		});
		
		/*for(var kk in amexCompare.questionsFilter){
			var seleQ= amexCompare.questionsFilter[kk];
			if(question == amexCompare.getOtherCardName(seleQ)){
				console.log("ignore -- "+ question);
			}
		}*/
		
		if (matchingCards > 0) {
			countStr = ' (' + matchingCards +')';
			$('.q_radios label[rel="' + question + '"]').removeClass('inactive').find('span').text(countStr);
		} else {
			countStr = ' (0)';
			$('.q_radios label[rel="' + question + '"]').addClass('inactive').find('span').text(countStr);			
		}
		$('.q_radios a.selected').each(function () {
			$(this).next().next().find('span').text('');
		});
		//console.log(question, matchingCards);
		for(var jj in amexCompare.questionsFilter){
			var seleQJJ= amexCompare.questionsFilter[jj];
			amexCompare.countRemainingCardsUnselected(amexCompare.getOtherCardName(seleQJJ));
		}
	}
	
},

countRemainingCardsUnselected: function (seleQ) {
	
	question = (seleQ);
	var matchingCards = 0;
	$('.card').not('.lesserValue').each(function () {
					var card = $(this).data('cardInfo');
					var matchh=true;					
					for(var jj in amexCompare.questionsFilter){
						var seleQJJ= amexCompare.questionsFilter[jj];
						if(amexCompare.getOtherCardName(question) == seleQJJ && amexCompare.questionsFilter.length != 1){
						//console.log("skip loop " + amexCompare.getOtherCardName(seleQ));
						continue;	
						}
						matchh=true;											
						if(amexCompare.questionsFilter.length == 1){
							if (amexCompare.cardGroups[card.cardGroup].cards[card.cardName][question] != "true"){
								matchh=false;
								break;
							}
						}else{
							//$.trace(card.cardGroup + " card.cardGroup  --   card.cardName "+ card.cardName);
							//console.log(card.cardGroup + " card.cardGroup  --   card.cardName "+ card.cardName);
							//console.log(amexCompare.cardGroups[card.cardGroup].cards[card.cardName][question]+"  --   "+ question+"  --   "+seleQJJ +"  --   "+amexCompare.cardGroups[card.cardGroup].cards[card.cardName][seleQJJ])
							if (amexCompare.cardGroups[card.cardGroup].cards[card.cardName][question] == "true"){	
								//console.log(card.cardName +" -- is true "+ question +" inner check "+seleQJJ);						
								if (amexCompare.cardGroups[card.cardGroup].cards[card.cardName][seleQJJ] != "true" ){
									//console.log(card.cardName +" -- is false " + seleQJJ);	
									matchh=false;
									break;
								}	
							}else{
								matchh=false;
									break;
							}
							
						}
					}
					
					if (matchh) {
						//matchedCard = true;
						(matchingCards++);
					}					
					
				});	
		
			if (matchingCards > 0) {
			countStr = ' (' + matchingCards +')';
			$('.q_radios label[rel="' + question + '"]').removeClass('inactive').find('span').text(countStr);
		} else {
			countStr = ' (0)';
			$('.q_radios label[rel="' + question + '"]').addClass('inactive').find('span').text(countStr);			
		}
		
},

initializeHandlers: function () {
  if (amexCompare.xmlParsed === 3) {
    amexCompare.styleRadioButtons();
    amexCompare.attachGeneralHandlers();
    amexCompare.alignTooltipBtns();
    amexCompare.questionCardFiltering();
    amexCompare.setupShortlistHandlers();
  }

}

}

