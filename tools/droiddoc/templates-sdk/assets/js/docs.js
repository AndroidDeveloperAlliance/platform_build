var classesNav;
var devdocNav;
var sidenav;
var cookie_namespace = 'android_developer';
var NAV_PREF_TREE = "tree";
var NAV_PREF_PANELS = "panels";
var nav_pref;
var isMobile = false; // true if mobile, so we can adjust some layout

var basePath = getBaseUri(location.pathname);
var SITE_ROOT = toRoot + basePath.substring(1,basePath.indexOf("/",1));
  

/******  ON LOAD SET UP STUFF *********/

var navBarIsFixed = false;
$(document).ready(function() {
  // init the fullscreen toggle click event
  $('#nav-swap .fullscreen').click(function(){
    if ($(this).hasClass('disabled')) {
      toggleFullscreen(true);
    } else {
      toggleFullscreen(false);
    }
  });
  
  // initialize the divs with custom scrollbars
  $('.scroll-pane').jScrollPane( {verticalGutter:0} );
  
  // add HRs below all H2s (except for a few other h2 variants)
  $('h2').not('#qv h2').not('#tb h2').not('#devdoc-nav h2').css({marginBottom:0}).after('<hr/>');
  
  // set search's onkeyup handler here so we can show suggestions 
  // even while search results are visible
  $("#search_autocomplete").keyup(function() {return search_changed(event, false, toRoot)});

  // set up the search close button
  $('.search .close').click(function() {
    $searchInput = $('#search_autocomplete');
    $searchInput.attr('value', '');
    $(this).addClass("hide");
    $("#search-container").removeClass('active');
    $("#search_autocomplete").blur();
    search_focus_changed($searchInput.get(), false);  // see search_autocomplete.js
    hideResults();  // see search_autocomplete.js
  });
  $('.search').click(function() {
    if (!$('#search_autocomplete').is(":focused")) {
        $('#search_autocomplete').focus();
    }
  });

  // Set up quicknav
  var quicknav_open = false;  
  $("#btn-quicknav").click(function() {
    if (quicknav_open) {
      $(this).removeClass('active');
      quicknav_open = false;
      collapse();
    } else {
      $(this).addClass('active');
      quicknav_open = true;
      expand();
    }
  })
  
  var expand = function() {
   $('#header-wrap').addClass('quicknav');
   $('#quicknav').stop().show().animate({opacity:'1'});
  }
  
  var collapse = function() {
    $('#quicknav').stop().animate({opacity:'0'}, 100, function() {
      $(this).hide();
      $('#header-wrap').removeClass('quicknav');
    });
  }
  
  
  //Set up search
  $("#search_autocomplete").focus(function() {
    $("#search-container").addClass('active');
  })
  $("#search-container").mouseover(function() {
    $("#search-container").addClass('active');
    $("#search_autocomplete").focus();
  })
  $("#search-container").mouseout(function() {
    if ($("#search_autocomplete").is(":focus")) return;
    if ($("#search_autocomplete").val() == '') {
      setTimeout(function(){
        $("#search-container").removeClass('active');
        $("#search_autocomplete").blur();
      },250);
    }
  })
  $("#search_autocomplete").blur(function() {
    if ($("#search_autocomplete").val() == '') {
      $("#search-container").removeClass('active');
    }
  })

    
  // prep nav expandos
  var pagePath = document.location.pathname;
  // account for intl docs by removing the intl/*/ path
  if (pagePath.indexOf("/intl/") == 0) {
    pagePath = pagePath.substr(pagePath.indexOf("/",6)); // start after intl/ to get last /
  }
  
  if (pagePath.indexOf(SITE_ROOT) == 0) {
    if (pagePath == '' || pagePath.charAt(pagePath.length - 1) == '/') {
      pagePath += 'index.html';
    }
  }

  if (SITE_ROOT.match(/\.\.\//) || SITE_ROOT == '') {
    // If running locally, SITE_ROOT will be a relative path, so account for that by
    // finding the relative URL to this page. This will allow us to find links on the page
    // leading back to this page.
    var pathParts = pagePath.split('/');
    var relativePagePathParts = [];
    var upDirs = (SITE_ROOT.match(/(\.\.\/)+/) || [''])[0].length / 3;
    for (var i = 0; i < upDirs; i++) {
      relativePagePathParts.push('..');
    }
    for (var i = 0; i < upDirs; i++) {
      relativePagePathParts.push(pathParts[pathParts.length - (upDirs - i) - 1]);
    }
    relativePagePathParts.push(pathParts[pathParts.length - 1]);
    pagePath = relativePagePathParts.join('/');
  } else {
    // Otherwise the page path is already an absolute URL
  }

  // select current page in sidenav and set up prev/next links if they exist
  var $selNavLink = $('#nav').find('a[href="' + pagePath + '"]');
  if ($selNavLink.length) {
    $selListItem = $selNavLink.closest('li');

    $selListItem.addClass('selected');
    $selListItem.closest('li.nav-section').addClass('expanded');
    $selListItem.closest('li.nav-section').children('ul').show();
    $selListItem.closest('li.nav-section').parent().closest('li.nav-section').addClass('expanded');
    $selListItem.closest('li.nav-section').parent().closest('ul').show();
    
    
  //  $selListItem.closest('li.nav-section').closest('li.nav-section').addClass('expanded');
  //  $selListItem.closest('li.nav-section').closest('li.nav-section').children('ul').show();  

    // set up prev links
    var $prevLink = [];
    var $prevListItem = $selListItem.prev('li');
    
    var crossBoundaries = ($("body.design").length > 0) || ($("body.guide").length > 0) ? true :
false; // navigate across topic boundaries only in design docs
    if ($prevListItem.length) {
      if ($prevListItem.hasClass('nav-section')) {
        if (crossBoundaries) {
          // jump to last topic of previous section
          $prevLink = $prevListItem.find('a:last');
        }
      } else {
        // jump to previous topic in this section
        $prevLink = $prevListItem.find('a:eq(0)');
      }
    } else {
      // jump to this section's index page (if it exists)
      var $parentListItem = $selListItem.parents('li');
      $prevLink = $selListItem.parents('li').find('a');
      
      // except if cross boundaries aren't allowed, and we're at the top of a section already
      // (and there's another parent)
      if (!crossBoundaries && $parentListItem.hasClass('nav-section') 
                           && $selListItem.hasClass('nav-section')) {
        $prevLink = [];
      }
    }

    if ($prevLink.length) {
      var prevHref = $prevLink.attr('href');
      if (prevHref == SITE_ROOT + 'index.html') {
        // Don't show Previous when it leads to the homepage
      } else {
        $('.prev-page-link').attr('href', $prevLink.attr('href')).removeClass("hide");
      }
    } 

    // set up next links
    var $nextLink = [];
    var startCourse = false;
    var startClass = false;
    var training = $(".next-class-link").length; // decides whether to provide "next class" link
    var isCrossingBoundary = false;
    
    if ($selListItem.hasClass('nav-section')) {
      // we're on an index page, jump to the first topic
      $nextLink = $selListItem.find('ul').find('a:eq(0)');

      // if there aren't any children, go to the next section (required for About pages)
      if($nextLink.length == 0) {
        $nextLink = $selListItem.next('li').find('a');
      }
      
      // Handle some Training specialties
      if ($selListItem.parent().is("#nav") && $(".start-course-link").length) {
        // this means we're at the very top of the TOC hierarchy
        startCourse = true;
      } else if ($(".start-class-link").length) {
        // this means this page has children but is not at the top (it's a class, not a course)
        startClass = true;
      }
    } else {
      // jump to the next topic in this section (if it exists)
      $nextLink = $selListItem.next('li').find('a:eq(0)');
      if (!$nextLink.length) {
        if (crossBoundaries || training) {
          // no more topics in this section, jump to the first topic in the next section
          $nextLink = $selListItem.parents('li:eq(0)').next('li.nav-section').find('a:eq(0)');
          isCrossingBoundary = true;
        }
      }
    }
    if ($nextLink.length) {
      if (startCourse || startClass) {
        if (startCourse) {
          $('.start-course-link').attr('href', $nextLink.attr('href')).removeClass("hide");
        } else {
          $('.start-class-link').attr('href', $nextLink.attr('href')).removeClass("hide");
        }
        // if there's no training bar (below the start button), 
        // then we need to add a bottom border to button
        if (!$("#tb").length) {
          $('.start-course-link').css({'border-bottom':'1px solid #DADADA'});
          $('.start-class-link').css({'border-bottom':'1px solid #DADADA'});
        }
      } else if (training && isCrossingBoundary) {
        $('.content-footer.next-class').show();
        $('.next-page-link').attr('href','')
                            .removeClass("hide").addClass("disabled")
                            .click(function() { return false; });
       
        $('.next-class-link').attr('href',$nextLink.attr('href'))
                            .removeClass("hide").append($nextLink.html());
        $('.next-class-link').find('.new').empty();
      } else {
        $('.next-page-link').attr('href', $nextLink.attr('href')).removeClass("hide");
      }
    }
    
  }



  // Set up expand/collapse behavior
  $('#nav li.nav-section .nav-section-header').click(function() {
    var section = $(this).closest('li.nav-section');
    if (section.hasClass('expanded')) {
    /* hide me */
    //  if (section.hasClass('selected') || section.find('li').hasClass('selected')) {
   //   /* but not if myself or my descendents are selected */
   //     return;
    //  }
      section.children('ul').slideUp(250, function() {
        section.closest('li').removeClass('expanded');
        resizeNav();
      });
    } else {
    /* show me */
      // first hide all other siblings
      var $others = $('li.nav-section.expanded', $(this).closest('ul'));
      $others.removeClass('expanded').children('ul').slideUp(250);
      
      // now expand me
      section.closest('li').addClass('expanded');
      section.children('ul').slideDown(250, function() {
        resizeNav();
      });
    }
  });
  
  $(".scroll-pane").scroll(function(event) {
      event.preventDefault();
      return false;
  });

  /* Resize nav height when window height changes */
  $(window).resize(function() {
    if ($('#side-nav').length == 0) return;
    var stylesheet = $('link[rel="stylesheet"][class="fullscreen"]');
    setNavBarLeftPos(); // do this even if sidenav isn't fixed because it could become fixed
    // make sidenav behave when resizing the window and side-scolling is a concern
    if (navBarIsFixed) {
      if ((stylesheet.attr("disabled") == "disabled") || stylesheet.length == 0) {
        updateSideNavPosition();
      } else {
        updateSidenavFullscreenWidth();
      }
    }
    resizeNav();
  });


  // Set up fixed navbar
  var prevScrollLeft = 0; // used to compare current position to previous position of horiz scroll
  $(window).scroll(function(event) {
    if ($('#side-nav').length == 0) return;
    if (event.target.nodeName == "DIV") {
      // Dump scroll event if the target is a DIV, because that means the event is coming
      // from a scrollable div and so there's no need to make adjustments to our layout
      return;
    }
    var scrollTop = $(window).scrollTop();    
    var headerHeight = $('#header').outerHeight();
    var subheaderHeight = $('#nav-x').outerHeight();
    var searchResultHeight = $('#searchResults').is(":visible") ? 
                             $('#searchResults').outerHeight() : 0;
    var totalHeaderHeight = headerHeight + subheaderHeight + searchResultHeight;
    var navBarShouldBeFixed = scrollTop > totalHeaderHeight;
   
    var scrollLeft = $(window).scrollLeft();
    // When the sidenav is fixed and user scrolls horizontally, reposition the sidenav to match
    if (navBarIsFixed && (scrollLeft != prevScrollLeft)) {
      updateSideNavPosition();
      prevScrollLeft = scrollLeft;
    }
    
    // Don't continue if the header is sufficently far away 
    // (to avoid intensive resizing that slows scrolling)
    if (navBarIsFixed && navBarShouldBeFixed) {
      return;
    }
    
    if (navBarIsFixed != navBarShouldBeFixed) {
      if (navBarShouldBeFixed) {
        // make it fixed
        var width = $('#devdoc-nav').width();
        $('#devdoc-nav')
            .addClass('fixed')
            .css({'width':width+'px'})
            .prependTo('#body-content');
        // add neato "back to top" button
        $('#devdoc-nav a.totop').css({'display':'block','width':$("#nav").innerWidth()+'px'});
        
        // update the sidenaav position for side scrolling
        updateSideNavPosition();
      } else {
        // make it static again
        $('#devdoc-nav')
            .removeClass('fixed')
            .css({'width':'auto','margin':''})
            .prependTo('#side-nav');
        $('#devdoc-nav a.totop').hide();
      }
      navBarIsFixed = navBarShouldBeFixed;
    } 
    
    resizeNav(250); // pass true in order to delay the scrollbar re-initialization for performance
  });

  
  var navBarLeftPos;
  if ($('#devdoc-nav').length) {
    setNavBarLeftPos();
  }


  // Stop expand/collapse behavior when clicking on nav section links (since we're navigating away
  // from the page)
  $('.nav-section-header').find('a:eq(0)').click(function(evt) {
    window.location.href = $(this).attr('href');
    return false;
  });

  // Set up play-on-hover <video> tags.
  $('video.play-on-hover').bind('click', function(){
    $(this).get(0).load(); // in case the video isn't seekable
    $(this).get(0).play();
  });

  // Set up tooltips
  var TOOLTIP_MARGIN = 10;
  $('acronym').each(function() {
    var $target = $(this);
    var $tooltip = $('<div>')
        .addClass('tooltip-box')
        .text($target.attr('title'))
        .hide()
        .appendTo('body');
    $target.removeAttr('title');

    $target.hover(function() {
      // in
      var targetRect = $target.offset();
      targetRect.width = $target.width();
      targetRect.height = $target.height();

      $tooltip.css({
        left: targetRect.left,
        top: targetRect.top + targetRect.height + TOOLTIP_MARGIN
      });
      $tooltip.addClass('below');
      $tooltip.show();
    }, function() {
      // out
      $tooltip.hide();
    });
  });

  // Set up <h2> deeplinks
  $('h2').click(function() {
    var id = $(this).attr('id');
    if (id) {
      document.location.hash = id;
    }
  });

  //Loads the +1 button
  var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
  po.src = 'https://apis.google.com/js/plusone.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);


  // Revise the sidenav widths to make room for the scrollbar 
  // which avoids the visible width from changing each time the bar appears
  var $sidenav = $("#side-nav");
  var sidenav_width = parseInt($sidenav.innerWidth());
    
  $("#devdoc-nav  #nav").css("width", sidenav_width - 4 + "px"); // 4px is scrollbar width


  $(".scroll-pane").removeAttr("tabindex"); // get rid of tabindex added by jscroller
  
  if ($(".scroll-pane").length > 1) {
    // Check if there's a user preference for the panel heights
    var cookieHeight = readCookie("reference_height");
    if (cookieHeight) {
      restoreHeight(cookieHeight);
    }
  }
  
  resizeNav();


});



function toggleFullscreen(enable) {
  var delay = 20;
  var enabled = true;
  var stylesheet = $('link[rel="stylesheet"][class="fullscreen"]');
  if (enable) {
    // Currently NOT USING fullscreen; enable fullscreen
    stylesheet.removeAttr('disabled');
    $('#nav-swap .fullscreen').removeClass('disabled');
    $('#devdoc-nav').css({left:''});
    setTimeout(updateSidenavFullscreenWidth,delay); // need to wait a moment for css to switch
    enabled = true;
  } else {
    // Currently USING fullscreen; disable fullscreen
    stylesheet.attr('disabled', 'disabled');
    $('#nav-swap .fullscreen').addClass('disabled');
    setTimeout(updateSidenavFixedWidth,delay); // need to wait a moment for css to switch
    enabled = false;
  }
  writeCookie("fullscreen", enabled, null, null);
  setNavBarLeftPos();
  resizeNav(delay);
  updateSideNavPosition();
  setTimeout(initSidenavHeightResize,delay);
}


function setNavBarLeftPos() {
  navBarLeftPos = $('#body-content').offset().left;
}


function updateSideNavPosition() {
  var newLeft = $(window).scrollLeft() - navBarLeftPos;
  $('#devdoc-nav').css({left: -newLeft});
  $('#devdoc-nav .totop').css({left: -(newLeft - parseInt($('#side-nav').css('margin-left')))});
}
  







// TODO: use $(document).ready instead
function addLoadEvent(newfun) {
  var current = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = newfun;
  } else {
    window.onload = function() {
      current();
      newfun();
    }
  }
}

var agent = navigator['userAgent'].toLowerCase();
// If a mobile phone, set flag and do mobile setup
if ((agent.indexOf("mobile") != -1) ||      // android, iphone, ipod
    (agent.indexOf("blackberry") != -1) ||
    (agent.indexOf("webos") != -1) ||
    (agent.indexOf("mini") != -1)) {        // opera mini browsers
  isMobile = true;
}


/* loads the lists.js file to the page.
Loading this in the head was slowing page load time */
addLoadEvent( function() {
  var lists = document.createElement("script");
  lists.setAttribute("type","text/javascript");
  lists.setAttribute("src", toRoot+"reference/lists.js");
  document.getElementsByTagName("head")[0].appendChild(lists);
} );


addLoadEvent( function() {
  $("pre:not(.no-pretty-print)").addClass("prettyprint");
  prettyPrint();
} );

function init() {
  //resizeNav();

  resizePackagesNav = $("#resize-packages-nav");
  classesNav = $("#classes-nav");
  devdocNav = $("#devdoc-nav");

  var cookiePath = "";
  if (location.href.indexOf("/reference/") != -1) {
    cookiePath = "reference_";
  } else if (location.href.indexOf("/guide/") != -1) {
    cookiePath = "guide_";
  } else if (location.href.indexOf("/tools/") != -1) {
    cookiePath = "tools_";
  } else if (location.href.indexOf("/training/") != -1) {
    cookiePath = "training_";
  } else if (location.href.indexOf("/design/") != -1) {
    cookiePath = "design_";
  } else if (location.href.indexOf("/distribute/") != -1) {
    cookiePath = "distribute_";
  }
}



/* ######### RESIZE THE SIDENAV HEIGHT ########## */

function resizeNav(delay) {
  var $nav = $("#devdoc-nav");
  var $window = $(window);
  var navHeight;
  
  // Get the height of entire window and the total header height.
  // Then figure out based on scroll position whether the header is visible
  var windowHeight = $window.height();
  var scrollTop = $window.scrollTop();
  var headerHeight = $('#header').outerHeight();
  var subheaderHeight = $('#nav-x').outerHeight();
  var headerVisible = (scrollTop < (headerHeight + subheaderHeight));
  
  // get the height of space between nav and top of window. 
  // Could be either margin or top position, depending on whether the nav is fixed.
  var topMargin = (parseInt($nav.css('margin-top')) || parseInt($nav.css('top'))) + 1; 
  // add 1 for the #side-nav bottom margin
  
  // Depending on whether the header is visible, set the side nav's height.
  if (headerVisible) {
    // The sidenav height grows as the header goes off screen
    navHeight = windowHeight - (headerHeight + subheaderHeight - scrollTop) - topMargin;
  } else {
    // Once header is off screen, the nav height is almost full window height
    navHeight = windowHeight - topMargin;
  }
  
  
  
  $scrollPanes = $(".scroll-pane");
  if ($scrollPanes.length > 1) {
    // subtract the height of the api level widget and nav swapper from the available nav height
    navHeight -= ($('#api-nav-header').outerHeight(true) + $('#nav-swap').outerHeight(true));
    
    $("#swapper").css({height:navHeight + "px"});
    if ($("#nav-tree").is(":visible")) {
      $("#nav-tree").css({height:navHeight});
    }
    
    var classesHeight = navHeight - parseInt($("#resize-packages-nav").css("height")) - 10 + "px"; 
    //subtract 10px to account for drag bar
    
    // if the window becomes small enough to make the class panel height 0, 
    // then the package panel should begin to shrink
    if (parseInt(classesHeight) <= 0) {
      $("#resize-packages-nav").css({height:navHeight - 10}); //subtract 10px for drag bar
      $("#packages-nav").css({height:navHeight - 10});
    }
    
    $("#classes-nav").css({'height':classesHeight, 'margin-top':'10px'});
    $("#classes-nav .jspContainer").css({height:classesHeight});
    
    
  } else {
    $nav.height(navHeight);
  }
  
  if (delay) {
    updateFromResize = true;
    delayedReInitScrollbars(delay);
  } else {
    reInitScrollbars();
  }
  
}

var updateScrollbars = false;
var updateFromResize = false;

/* Re-initialize the scrollbars to account for changed nav size.
 * This method postpones the actual update by a 1/4 second in order to optimize the
 * scroll performance while the header is still visible, because re-initializing the
 * scroll panes is an intensive process.
 */
function delayedReInitScrollbars(delay) {
  // If we're scheduled for an update, but have received another resize request
  // before the scheduled resize has occured, just ignore the new request
  // (and wait for the scheduled one).
  if (updateScrollbars && updateFromResize) {
    updateFromResize = false;
    return;
  }
  
  // We're scheduled for an update and the update request came from this method's setTimeout
  if (updateScrollbars && !updateFromResize) {
    reInitScrollbars();
    updateScrollbars = false;
  } else {
    updateScrollbars = true;
    updateFromResize = false;
    setTimeout('delayedReInitScrollbars()',delay);
  }
}

/* Re-initialize the scrollbars to account for changed nav size. */
function reInitScrollbars() {
  var pane = $(".scroll-pane").each(function(){
    var api = $(this).data('jsp');
    if (!api) { setTimeout(reInitScrollbars,300); return;}
    api.reinitialise( {verticalGutter:0} );
  });  
  $(".scroll-pane").removeAttr("tabindex"); // get rid of tabindex added by jscroller
}


/* Resize the height of the nav panels in the reference,
 * and save the new size to a cookie */
function saveNavPanels() {
  var basePath = getBaseUri(location.pathname);
  var section = basePath.substring(1,basePath.indexOf("/",1));
  writeCookie("height", resizePackagesNav.css("height"), section, null);
}



function restoreHeight(packageHeight) {
    $("#resize-packages-nav").height(packageHeight);
    $("#packages-nav").height(packageHeight);
  //  var classesHeight = navHeight - packageHeight;
 //   $("#classes-nav").css({height:classesHeight});
  //  $("#classes-nav .jspContainer").css({height:classesHeight});
}



/* ######### END RESIZE THE SIDENAV HEIGHT ########## */





/** Scroll the jScrollPane to make the currently selected item visible 
    This is called when the page finished loading. */
function scrollIntoView(nav) {
  var $nav = $("#"+nav);
  var element = $nav.jScrollPane({/* ...settings... */});
  var api = element.data('jsp');

  if ($nav.is(':visible')) {
    var $selected = $(".selected", $nav);
    if ($selected.length == 0) return;
    
    var selectedOffset = $selected.position().top;
    if (selectedOffset + 90 > $nav.height()) {  // add 90 so that we scroll up even 
                                                // if the current item is close to the bottom
      api.scrollTo(0, selectedOffset - ($nav.height() / 4), false); // scroll the item into view
                                                              // to be 1/4 of the way from the top
    }
  }
}






/* Show popup dialogs */
function showDialog(id) {
  $dialog = $("#"+id);
  $dialog.prepend('<div class="box-border"><div class="top"> <div class="left"></div> <div class="right"></div></div><div class="bottom"> <div class="left"></div> <div class="right"></div> </div> </div>');
  $dialog.wrapInner('<div/>');
  $dialog.removeClass("hide");
}





/* #########    COOKIES!     ########## */

function readCookie(cookie) {
  var myCookie = cookie_namespace+"_"+cookie+"=";
  if (document.cookie) {
    var index = document.cookie.indexOf(myCookie);
    if (index != -1) {
      var valStart = index + myCookie.length;
      var valEnd = document.cookie.indexOf(";", valStart);
      if (valEnd == -1) {
        valEnd = document.cookie.length;
      }
      var val = document.cookie.substring(valStart, valEnd);
      return val;
    }
  }
  return 0;
}

function writeCookie(cookie, val, section, expiration) {
  if (val==undefined) return;
  section = section == null ? "_" : "_"+section+"_";
  if (expiration == null) {
    var date = new Date();
    date.setTime(date.getTime()+(10*365*24*60*60*1000)); // default expiration is one week
    expiration = date.toGMTString();
  }
  var cookieValue = cookie_namespace + section + cookie + "=" + val 
                    + "; expires=" + expiration+"; path=/";
  document.cookie = cookieValue;
}

/* #########     END COOKIES!     ########## */

























/*

REMEMBER THE PREVIOUS PAGE FOR EACH TAB

function loadLast(cookiePath) {
  var location = window.location.href;
  if (location.indexOf("/"+cookiePath+"/") != -1) {
    return true;
  }
  var lastPage = readCookie(cookiePath + "_lastpage");
  if (lastPage) {
    window.location = lastPage;
    return false;
  }
  return true;
}



$(window).unload(function(){
  var path = getBaseUri(location.pathname);
  if (path.indexOf("/reference/") != -1) {
    writeCookie("lastpage", path, "reference", null);
  } else if (path.indexOf("/guide/") != -1) {
    writeCookie("lastpage", path, "guide", null);
  } else if ((path.indexOf("/resources/") != -1) || (path.indexOf("/training/") != -1)) {
    writeCookie("lastpage", path, "resources", null);
  }
});

*/














function toggle(obj, slide) {
  var ul = $("ul:first", obj);
  var li = ul.parent();
  if (li.hasClass("closed")) {
    if (slide) {
      ul.slideDown("fast");
    } else {
      ul.show();
    }
    li.removeClass("closed");
    li.addClass("open");
    $(".toggle-img", li).attr("title", "hide pages");
  } else {
    ul.slideUp("fast");
    li.removeClass("open");
    li.addClass("closed");
    $(".toggle-img", li).attr("title", "show pages");
  }
}





function buildToggleLists() {
  $(".toggle-list").each(
    function(i) {
      $("div:first", this).append("<a class='toggle-img' href='#' title='show pages' onClick='toggle(this.parentNode.parentNode, true); return false;'></a>");
      $(this).addClass("closed");
    });
}
































/*      REFERENCE NAV SWAP     */


function getNavPref() {
  var v = readCookie('reference_nav');
  if (v != NAV_PREF_TREE) {
    v = NAV_PREF_PANELS;
  }
  return v;
}

function chooseDefaultNav() {
  nav_pref = getNavPref();
  if (nav_pref == NAV_PREF_TREE) {
    $("#nav-panels").toggle();
    $("#panel-link").toggle();
    $("#nav-tree").toggle();
    $("#tree-link").toggle();
  }
}

function swapNav() {
  if (nav_pref == NAV_PREF_TREE) {
    nav_pref = NAV_PREF_PANELS;
  } else {
    nav_pref = NAV_PREF_TREE;
    init_default_navtree(toRoot);
  }
  var date = new Date();
  date.setTime(date.getTime()+(10*365*24*60*60*1000)); // keep this for 10 years
  writeCookie("nav", nav_pref, "reference", date.toGMTString());

  $("#nav-panels").toggle();
  $("#panel-link").toggle();
  $("#nav-tree").toggle();
  $("#tree-link").toggle();
  
  resizeNav();

  // Gross nasty hack to make tree view show up upon first swap by setting height manually
  $("#nav-tree .jspContainer:visible")
      .css({'height':$("#nav-tree .jspContainer .jspPane").height() +'px'});
  // Another nasty hack to make the scrollbar appear now that we have height
  resizeNav();
  
  if ($("#nav-tree").is(':visible')) {
    scrollIntoView("nav-tree");
  } else {
    scrollIntoView("packages-nav");
    scrollIntoView("classes-nav");
  }
}

























/* ##########     LOCALIZATION     ############ */

function getBaseUri(uri) {
  var intlUrl = (uri.substring(0,6) == "/intl/");
  if (intlUrl) {
    base = uri.substring(uri.indexOf('intl/')+5,uri.length);
    base = base.substring(base.indexOf('/')+1, base.length);
      //alert("intl, returning base url: /" + base);
    return ("/" + base);
  } else {
      //alert("not intl, returning uri as found.");
    return uri;
  }
}

function requestAppendHL(uri) {
//append "?hl=<lang> to an outgoing request (such as to blog)
  var lang = getLangPref();
  if (lang) {
    var q = 'hl=' + lang;
    uri += '?' + q;
    window.location = uri;
    return false;
  } else {
    return true;
  }
}


function changeTabLang(lang) {
  var nodes = $("#header-tabs").find("."+lang);
  for (i=0; i < nodes.length; i++) { // for each node in this language
    var node = $(nodes[i]);
    node.siblings().css("display","none"); // hide all siblings
    if (node.not(":empty").length != 0) { //if this languages node has a translation, show it
      node.css("display","inline");
    } else { //otherwise, show English instead
      node.css("display","none");
      node.siblings().filter(".en").css("display","inline");
    }
  }
}

function changeNavLang(lang) {
  var nodes = $("#devdoc-nav").find("."+lang);
  for (i=0; i < nodes.length; i++) { // for each node in this language
    var node = $(nodes[i]);
    node.siblings().css("display","none"); // hide all siblings
    if (node.not(":empty").length != 0) { // if this languages node has a translation, show it
      node.css("display","inline");
    } else { // otherwise, show English instead
      node.css("display","none");
      node.siblings().filter(".en").css("display","inline");
    }
  }
}

function changeDocLang(lang) {
  changeTabLang(lang);
  changeNavLang(lang);
}

function changeLangPref(lang, refresh) {
  var date = new Date();
  expires = date.toGMTString(date.setTime(date.getTime()+(10*365*24*60*60*1000))); 
  // keep this for 50 years
  //alert("expires: " + expires)
  writeCookie("pref_lang", lang, null, expires);
  changeDocLang(lang);
  if (refresh) {
    l = getBaseUri(location.pathname);
    window.location = l;
  }
}

function loadLangPref() {
  var lang = readCookie("pref_lang");
  if (lang != 0) {
    $("#language").find("option[value='"+lang+"']").attr("selected",true);
  }
}

function getLangPref() {
  var lang = $("#language").find(":selected").attr("value");
  if (!lang) {
    lang = readCookie("pref_lang");
  }
  return (lang != 0) ? lang : 'en';
}

/* ##########     END LOCALIZATION     ############ */






/* Used to hide and reveal supplemental content, such as long code samples.
   See the companion CSS in android-developer-docs.css */
function toggleContent(obj) {
  var div = $(obj.parentNode.parentNode);
  var toggleMe = $(".toggle-content-toggleme",div);
  if (div.hasClass("closed")) { // if it's closed, open it
    toggleMe.slideDown();
    $(".toggle-content-text", obj).toggle();
    div.removeClass("closed").addClass("open");
    $(".toggle-content-img", div).attr("title", "hide").attr("src", toRoot 
                  + "assets/images/triangle-opened.png");
  } else { // if it's open, close it
    toggleMe.slideUp('fast', function() {  // Wait until the animation is done before closing arrow
      $(".toggle-content-text", obj).toggle();
      div.removeClass("open").addClass("closed");
      $(".toggle-content-img", div).attr("title", "show").attr("src", toRoot 
                  + "assets/images/triangle-closed.png");
    });
  }
  return false;
}
