/**
 * Transitions: a Zepto plugin for animated page transitions, similar to
 * the navigation that JQuery Mobile provides.
 * 2012, David Gileadi
 *
 * Released into the public domain.
 *
 *THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * @author gileadis@gmail.com
 * @version 1.0.0
 * 
 * @requires 
 * Zepto JavaScript Library: http://zeptojs.com
 */

$(document).ready(function() {

	$(document.body).transition('init').show();
});

(function( $ ) {

	var zIndex				= 0,
		inited				= false,
		baseUrl				= window.location.href.slice(0, window.location.href.lastIndexOf('/') + 1),
		settings			= null,
		sourcePages			= {},
		lastLoaded			= window.location.href,
		action				= null,
		transition			= null,
		ignoreHash			= {},
		history				= [];

	var methods = {

		options : function(options) {

			settings = $.extend( {
				defaultPageTransition : 'fade',
				domCache : false
			}, options);
		},

		init : function(eventData, targetPage, title) {

			// one-time initialization
			if (!inited) {
				inited = true;

				$(document.body).transition('options', {});

				$(window).on('hashchange', function(e) {
					var target = (action && action.element) || $(document.body);
					if (!ignoreHash[window.location.hash]) {
						var to = window.location.hash;
						if (action && action.element && action.element.is('form')) {
							to = {
								type: action.element.attr('method') || 'get',
								url: window.location.hash.slice(1),
								data: action.element.serialize(),
								dataType: 'html',
								global: false
							};
						}
						var transition = null;
						var back = action == null;
						if (back)
							transition = history.length ? history.pop().transition : settings.defaultPageTransition;
						else if (action.transition) {
							transition = action.transition;
							history.push({href: window.location.pathname, transition: transition});
							back = action.reverse;
						} else {
							transition = action.element.attr('transition') || action.element.data('transition') || settings.defaultPageTransition;
							history.push({href: window.location.pathname, transition: transition});
							var direction = action.element.attr('direction') || action.element.data('direction');
							if (direction === 'reverse')
								back = true;
						}
						target.transition('changePage', to, transition, back);
					}
					action = null;
				});
			}

			// create logical pages in divs
			var pages = $('div[data-role="page"]', this);
			if (!pages.length) {
				if (this.is('div')) {
					this.attr('data-role', 'page');
					this.attr('id', '_trans_div' + zIndex);
					pages = this;
				} else {
					pages = $('<div data-role="page" id="_trans_div' + zIndex + '" />');
					this.children().wrapAll(pages);
				}
			}

			if (eventData)
				pages.trigger('pageload', eventData);

			// the initial page is special: its id must equal its hash
			var initial = pages.first();
			if (window.location.hash) {
				initial = $(window.location.hash);
				if (!initial.length) {
					initial = pages.first();
					var formerId = initial.attr('id');
					var id = toId(sourcePages[window.location.hash] || window.location.hash.slice(1));
					initial.attr('id', id);
					if (formerId) {
						// fix all links that pointed to it
						$('[data-href="#' + formerId + '"]', pages).attr('data-href', '#' + id);
						$('[href="#' + formerId + '"]', pages).attr('href', '#' + id);
					}
				}
			}

			pages.addClass('ui-page');
			pages.each(function() {
				if (!$(this).attr('id'))
					$(this).attr('id', '_trans_div' + zIndex);
				sourcePages['#' + $(this).attr('id')] = lastLoaded;

				$(this).css('zIndex', zIndex++);
			});

			$('a[href]', pages).not('[target]').not('[rel="external"]').not('[data-ajax="false"]').not('[data-href]').transition('hijackLinks');
			$('[data-href]', pages).transition('hijackLinks');
			$('form').not('[target]').not('[data-ajax="false"]').transition('hijackLinks');

			if (!title)
				title = document.title;
			pages.not('[data-title]').data('title', title);
			title = initial.data('title');
			if (title)
				document.title = title;

			pages.hide();
			var active = targetPage ? $(targetPage) : null;
			active = active || initial;
			active.addClass('ui-page-active');

			pages.each(function() {
				$(this).trigger('pageinit', $(this));
			});

			return active;
		},

		to : function(page, transition, reverse) {

			transition = transition || settings.defaultPageTransition;
			if (!reverse)
				reverse = false;
			action = {transition: transition, reverse: reverse};
			window.location.hash = '#' + page;
		},

		hijackLinks : function() {

			return this.each(function() {
				var el = $(this);

				if (el.data('rel') == 'back') {
					var handler = function(e) {
						window.history.back();
						e.preventDefault();
					};
					el.on('click', handler);
					el.on('tap', handler);
					return;
				}

				var href = el.attr('data-href') || el.attr('href') || el.attr('action') || "#";
				if (href.charAt(0) === '#') {
					// ignore some hash links; this is buggy when navigating backwards
					if ($('a[name="' + href.slice(1) + '"]').length) {
						ignoreHash[href] = true;
						return;
					}
				} else {
					// change all links to be hash links
					href = '#' + href;
					if (el.is('a'))
						el.attr('href', href);
					else if (el.attr('action'))
						el.attr('action', href);
					if (el.attr('data-href'))
						el.attr('data-href', href);
				}

				var handler;
				if (el.is('a')) {
					handler = function(e) {
						action = {element: el};
					};
				} else if (el.is('form')) {
					handler = function(e) {
						action = {element: el};
						window.location.href = href;
						e.preventDefault();
					}
					el.on('submit', handler);
				} else {
					handler = function(e) {
						action = {element: el};
						window.location.href = href;
					}
				}

				if (!el.is('form')) {
					el.on('click', handler);
					el.on('tap', handler);
				}
			});
		},

		changePage : function(to, transition, back) {

			var changeEventData = { toPage: to, back: back };
			var e = $.Event('pagebeforechange');
			$(this).trigger(e, changeEventData);
			if (e.defaultPrevented)
				return;
			else {
				to = changeEventData.toPage;
				back = changeEventData.back;
			}

			var href = typeof to === 'string' ? to : to.url;
			var targetPage = null;
			var from = $('div.ui-page-active');
			var handled = false;

			if ((typeof to === 'string') && to.charAt(0) === '#') {
				var toPage = $(toId(to));
				if (toPage.length) {
					$(this).transition('perform', from, toPage, transition, back, changeEventData);
					handled = true;
				} else if (!settings.domCache && sourcePages[to]) {
					targetPage = to;
					to = sourcePages[to];
				} else
					to = to.slice(1);
			}

			if (!handled) {
				var eventData = {href: href, element: $(this), back: back};
				var e = $.Event('pagebeforeload');
				$(this).trigger(e, eventData);
				var el = $(this);
				if (!e.defaultPrevented) {
					$(this).transition('load', to, eventData, function(body, result, title) {
						// add it to the current document
						var div = $('<div />');
						div.html(body);
						$(document.body).append(div);

						var to = $(div).transition('init', eventData, targetPage, title);
						$(el).transition('perform', from, to, transition, back, changeEventData);
					});
					handled = true;
				}
			}

			if (!handled)
				$(this).trigger('pagechangefailed', changeEventData);
		},

		load : function(what, eventData, onSuccess) {

			what = typeof what === 'string' ? {url: what, dataType: 'html', global: false} : what;
			if (!what.url)
				what.url = window.location.href;
			what.success = function(result, textStatus, xhr) {
				eventData.xhr = xhr;
				eventData.textStatus = textStatus;

				lastLoaded = what.url;

				// mark everything not just loaded as disposable
				if (!settings.domCache)
					$('div[data-role="page"]').not('[data-dom-cache="true"]').addClass('transition-recyclable');

				// extract the body and title from the html
				var bodyStart = result.search(/<body/i);
				var head = result;
				var body = result;
				var title;
				if (bodyStart != -1) {
					head = result.slice(0, bodyStart);
					bodyStart = result.indexOf('>', bodyStart);
					bodyEnd = result.search(/<\/body>/i);
					body = result.slice(bodyStart + 1, bodyEnd);
				}
				var match = head.match(/<title>(.+)<\/title>/im);
				if (match)
					title = match[1];

				// adjust relative links
				body = fixLinks(body);

				onSuccess(body, result, title);
			};
			what.error = function(xhr, textStatus, errorThrown) {
				eventData.xhr = xhr;
				eventData.textStatus = textStatus;
				eventData.errorThrown = errorThrown;
				$(this).trigger('pageloadfailed', eventData);
				$(this).trigger('pagechangefailed', {toPage: what.url});
			};
			$.ajax(what);
		},

		perform : function(from, to, transition, back, changeEventData) {

			changeEventData.from = from;
			changeEventData.to = to;

			from.trigger('pagebeforehide', from);
			to.trigger('pagebeforeshow', to);

			window.setTimeout(function() {
				from.addClass(transition + ' out');
				from.removeClass('ui-page-active');

				to.show();
				to.addClass(transition + ' in');
				to.addClass('ui-page-active');

				if (back) {
					from.addClass('reverse');
					to.addClass('reverse');
				}
			}, 1);

			window.setTimeout(function() {
				from.removeClass(transition + ' out');
				to.removeClass(transition + ' in');
				from.removeClass('reverse');
				to.removeClass('reverse');

				var title = to.data('title');
				if (title)
					document.title = title;

				from.trigger('pagehide', from);
				to.trigger('pageshow', to);

				$(document).trigger('pagechange', changeEventData);

				$('div[data-role="page"]').hide();
				to.show();

				// recycle all recyclable pages and empty divs
				if (!settings.domCache) {
					$('div.transition-recyclable').each(function() {
						var e = $.Event('pageremove');
						$(this).trigger(e, $(this));
						if (!e.defaultPrevented)
							$(this).remove();
					});
					$('div').not('[id]').not(function() {return $(this).children().length}).remove();
				}
			}, 707);
		}

	};

	$.fn.transition = function(method) {

		if (methods[method])
		  return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		else if (typeof method === 'object' || !method)
		  return methods.to.apply(this, arguments);
		else
		  throw 'Method ' +  method + ' does not exist';
	};

	function toId(url) { return url.replace(/[:\.\+\/]/g, '_'); }

	function fixLinks(body) {

		if (window.location.hash) {
			var relative = relativePath(window.location.pathname, window.location.hash.slice(1));
			if (relative.length) {
				body = body.replace(/(\b(src|href|action))="([^"#:]+)"/gi, '$1="' + relative + '$3"');

				// fix replaced links in the form of "relative/../"
				body = body.replace(/(\b(src|href|action))="(.+\/)?[^\/]+\/\.\.\//gi, '$1="$3');
			}
		}
		return body;
	}

	function relativePath(fromPath, toPath) {

		var relative = '';

		var slashIndex = toPath.lastIndexOf('/');
		if (slashIndex != -1) {
			relative = toPath.slice(0, slashIndex + 1);
			if (relative.charAt(0) == '/') {
				// strip the common start of paths
				if (!fromPath.charAt(0) == '/')
					fromPath = '/' + fromPath;
				var start = 1;
				slashIndex = start;
				do {
					slashIndex = relative.indexOf('/', slashIndex) + 1;
					if (slashIndex > start && relative.slice(0, slashIndex) == fromPath.slice(0, slashIndex))
						start = slashIndex;
				} while (slashIndex > 0 && slashIndex == start);

				// make a relative path between them
				var back = '';
				slashIndex = start;
				do {
					slashIndex = fromPath.indexOf('/', slashIndex + 1);
					if (slashIndex != -1)
						back += '../';
				} while (slashIndex != -1);

				relative = back + relative.slice(start);
			}
		}

		return relative;
	}

})( Zepto );