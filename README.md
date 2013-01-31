Zepto plugin for Animated CSS Page Transitions
======================

This HTML5 CSS Page Transitions plugin for [Zepto.js](http://zeptojs.com) is similar to [JQuery Mobile page transitions](http://jquerymobile.com/demos/1.2.0/docs/pages/page-navmodel.html), but is standalone, i.e. without all the other widgets and functionality that JQuery Mobile provides.  Consequently it is much smaller, at around 13k.

## What It Does ##

In order to support animated transitions between pages the plugin has to hijack regular browser navigation.  When you click a link or submit a form the plugin makes an AJAX request to load the new page.  It places the body of the loaded page into a new div, and then uses HTML5 CSS transitions to smoothly switch between the two pages.

## Example ##

The above may sound a little complicated, but using the plugin is quite simple.  Just include zepto.js and the CSS and JS file from this plugin in your main page (we'll call it simple.html):

	<html>
	    <head>
	        <link rel="stylesheet" type="text/css" href="transition.min.css" />
	        <script type="text/javascript" src="zepto.min.js"></script>
	        <script type="text/javascript" src="transition.min.js"></script>
	        <title>Page One</title>
	    </head>
	    <body>
	    	<h1>You're Starting On Page One</h1>
	        <a transition="flip" href="simple2.html">Flip to page two</a>
	    </body>
	</html>

Note the `transition="flip"` attribute.  You could also have used `data-transition="flip"`, or left the attribute off entirely to use the default transition.  Here's the page that it links to (simple2.html):

	<html>
	    <head>
	        <title>Page Two</title>
	    </head>
	    <body>
	    	<h1>You've Reached Page Two</h1>
	        <a data-rel="back" href="simple.html">Now back to page one</a>
	    </body>
	</html>

Notice that simple2.html doesn't have any links to stylesheets or Javascript files.  That's because the head content is thrown away when the page is loaded via AJAX.  If you want to run scripts or include styles specific to simple2.html then just include them within its `<body>` tag.

Also see the multi-page example for including multiple pages in a single HTML file.

## Transitions ##

This plugin includes the following CSS transitions, found in transition.css:

* spin
* slide
* slideup
* slidedown
* fade
* flip
* pop

You can create your own CSS transitions in your own CSS file.  Just reference them using the `transition="mycustomtransition"` or `data-transition="mycustomtransition"` attribute.

## Navigation ##

Any link can have a `transition` and/or `direction="reverse"` attribute (each of these can also be prefixed by `data-`).  Forms may also have these attributes.  Other elements like buttons can also trigger page transitions and have the above attributes; just add a `data-href` attribute to them.  Use the `data-rel="back"` attribute to navigate backwards using the browser history; any associated transitions will play in reverse.

Any link that has a `rel="external"` attribute will be excluded from using page transitions.  Likewise any link or form that has a `data-ajax="false"` or a `target` attribute will also be excluded.

You can link to HTML files that are not in the same level as the original HTML file, e.g. `href="path/with/slashes.html"`.  However this support is provided by replacing links in the loaded HTML and consequently may be slow and incomplete.  Avoid using multiple levels of pages when possible.

You can load pages programmatically, as demonstrated in the programmatic example:

	$(document).transition('to', relativeUrl, transition, reverse);

The `'to'`, `transition` and `reverse` arguments are optional.

## Multiple Pages In One File ##

To put several pages into one HTML file simply place each one inside its own `<div data-role="page">` tag.  To link to a page within the file first give each div its own `id` attribute, and then in the link use `href="#pageid"`, where pageid is the value of a page's id attribute.  Note that page id's should be unique across your site, not just within a single HTML file.

When you link to an HTML file containing multiple pages the first page is displayed.  To display a page other than the first, append the id of that page as a hash in the URL you load it with.  You can see this in action by loading the multiple page example like:

	multi-page.html#two

When you load a new page the browser's title is replaced with that page's title.  You can use the `data-title` attribute to give pages within an HTML file their own title.

## Caveats ##

Because this plugin loads pages using AJAX you can't use the regular `$(document).ready()` function that you may be used to for any page except the first.  Instead bind to the `pageinit` event, which will be triggered for each loaded page.  If you want to handle the `pageinit` event for the initial page, register your listener in a script tag that comes before including transition.js.  You can see this in the events example.

As mentioned in the example, head content is thrown away when an HTML file is loaded.  If you want to run scripts or include styles specific to a HTML file then include them within its `<body>` tag.  Put all shared scripts and styles into the original HTML file's head content.

## Options ##

To set the `defaultPageTransition` and/or `domCache` customization options you can use code like the following:

	$(document.body).transition('options', {defaultPageTransition : 'slide', domCache : true});

The default for `defaultPageTransition` is `"fade"` and the default for `domCache` is `false`.

## Events ##

This plugin shares many events with [JQuery Mobile](http://jquerymobile.com/demos/1.2.0/docs/api/events.html), although the data passed to the callback function is often different.  The events it supports are:

* `pagebeforeload`: called before a page is about to be loaded via AJAX.  The data object passed as the second argument to the callback function includes the following properties: `href`: the URL of the page to load, `element`: the element (if any) that triggered the load, and `back`: whether the load was triggered while navigating backwards.  This event may be prevented by the callback.
* `pageload`: called when the page is loaded via AJAX and added to the document, but before it is initialized.  The data object passed as the second argument to the callback function includes the same properties as the pagebeforeload event plus the following properties: `xhr`: the Zepto XMLHttpRequest used to load the page, and `textStatus`: the status of the request (if any).  This event may not be prevented.
* `pageloadfailed`: called when the page couldn't be loaded via AJAX.  The data object passed as the second argument to the callback function includes the same properties as the pagebeforeload event plus the following properties: `xhr`: the Zepto XMLHttpRequest used to load the page, `textStatus`: the status of the request (if any), and `errorThrown`: an exception object or text status.  This event may not be prevented.
* `pagebeforechange`: called before switching to a new page.  The data object passed as the second argument to the callback function includes the following properties: `toPage`: the URL or hash of the page to change to, and `back`: whether the page change is navigating backwards.  This event may be prevented by the callback.  Additionally any changes to toPage or back are reflected when changing the page.
* `pagechange`: called after the page change has been fully accomplished, including the transition and show/hide events.  The data object passed as the second argument to the callback function is the same as for the pagebeforechange event.  This event may not be prevented.
* `pagechangefailed`: called if the page change failed for any reason.  The data object passed as the second argument to the callback function is the same as for the pagebeforechange event.  This event may not be prevented.
* `pagebeforeshow`: called before a page is shown.  The data object passed as the second argument to the callback function is the page about to be shown.  This event may not be prevented.
* `pagebeforehide`: called before a page is hidden.  The data object passed as the second argument to the callback function is the page about to be hidden.  This event may not be prevented.
* `pageshow`: called after a page is shown.  The data object passed as the second argument to the callback function is the page that was shown.  This event may not be prevented.
* `pagehide`: called after a page is hidden.  The data object passed as the second argument to the callback function is the page that was hidden.  This event may not be prevented.
* `pageinit`: called when a page is fully initialized, but before it is shown.  The data object passed as the second argument to the callback function is the page that was initialized.  This event may not be prevented.
* `pageremove`: called before a page is removed from the DOM, which can happen when a new HTML file is loaded and the page is not being cached.  The data object passed as the second argument to the callback function is the page that will be removed.  This event may be prevented by the callback.

## Features ##

This transition plugin is largely modeled after the JQuery Mobile plugin's design, although it's written from scratch and thus may have its own quirks and bugs not shared by JQuery Mobile.  Here are some features that it shares with JQuery Mobile:

* Ajax navigation with page transitions for links and forms.
* Support for single- or multiple-page templates.
* The `data-href` attribute on non-link elements (like buttons).
* Ignoring links with `rel="external"`, `data-ajax="false"` or the `target` attribute.
* Linking within a multi-page document via `#id` links.  Note that unlike JQuery Mobile you don't need to use rel="external" when linking to an HTML file containing multiple pages.
* The `data-rel="back"` and `data-direction="reverse"` (or `direction="reverse"`) attributes for navigating backwards or making it appear that way.
* Caching individual pages via `data-dom-cache="true"`.
* The `defaultPageTransition` and `domCache` configuration options.

Features that JQuery Mobile provides that this plugin doesn't:

* Widgets, headers, footers, theming, etc.
* Wide cross-browser support.
* The page loading widget.
* Dialogs and the `data-rel="dialog"` attribute.
* Popups and the `data-role="popup"` attribute.
* The name and signature of Javascript functions.
* Prefetching pages.
* Graceful fallback to the "fade" transition for non-modern browsers.
* Max-scroll and max-width testing to avoid slow transitions.
* Custom transitions.
* The pushState plugin for friendly URLs.
* Use of the `<base>` element for assets in sub-pages with different paths.  This plugin instead rewrites URLs when necessary.
* The `data-ajax="false"` attribute on a parent element.
* The `data-url` attribute for linking to sub-pages.
* Most configuration options.
* Large file size :)
* Likely others I missed.

## Q & A ##

1. Why not use [insert your favorite plugin here] instead?
	* It didn't fit my needs (lightweight, uses Zepto.js, decent amount of features).
	* I didn't know about it.  Feel free to correct my error.
2. Why doesn't your plugin support [insert your favorite missing feature here]?
	* Probably because I didn't need it.  Feel free to file an enhancement request and I'll consider it.
3. I found a bug.
	* Please file it and I'll investigate.