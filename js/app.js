var TheLouvre = new Class({
  Implements: [Options, Events],
  
  options: {
    selector    : "img",
    
    show_event  : "click",
    next_event  : "click",
    prev_event  : "click",    
    close_event : "click",
    
    show_zone_class    : "the_louvre_show_zone",
    controls_class     : "the_louvre_controls",
    next_button_class  : "the_louvre_next the_louvre_button",
    close_button_class : "the_louvre_close the_louvre_button",
    prev_button_class  : "the_louvre_prev the_louvre_button",
    show_image_class   : "the_louvre_show_image",
    show_caption_class : "the_louvre_show_caption",    
    active_art_class   : "the_louvre_showing",
    disabled_button_class : "the_louvre_disabled",
    show_zone_open_class  : "the_louvre_open",   
    pinned_class       : "the_louvre_pinned", 
    
    next_button_html  : "next",
    close_button_html : "close",
    prev_button_html  : "previous",
    
    initially_showing_index : null,   
    toggle       : true,
    keyboard_nav : true,    
    superfluous_effects : true,
    cycle    : false,
    auto_pin : true,

    get_img_src : function(the_art){
      return the_art.get('src');
    },
    get_img_href : function(the_art){
      return null;
    },
    get_caption : function(the_art){
      return "";
    },
    update_show_zone: function(show_zone, the_art, index){
      show_zone.set('html','').adopt([
        new Element('img', {'class': this.options.show_image_class, 'src': this.options.get_img_src(the_art, index)}),
        new Element('div',   {'class': this.options.show_caption_class, 'html': this.options.get_caption(the_art, index)})
      ]);
      
      var href = this.options.get_img_href(the_art, index);
      if (href)
        new Element('a', {href: href}).wraps(show_zone.getFirst('img'));
        
      this.fireEvent('showZoneUpdated', [this.show_zone, this]);
    },
    show_zone_transition: function(show_zone, the_art, index, update_data){
      show_zone.set('tween', {
        duration: 50,
        onComplete: function(){
          update_data(); 
          show_zone.set('tween', {duration: 80}).fade('in');
        }
      }).fade('out');
    }
  },
  
  initialize: function(elem, options){
    this.setOptions(options);
    this.element = elem;
    this.the_art = this.element.getElements(this.options.selector);
    
    this.setup_show_zone();
    this.attach_events();
    this.setup_effects();
    
    if ($chk(this.options.initially_showing_index)){
      this.is_open = true;
      this.show(this.options.initially_showing_index);
    } else
      this.close();
      
    return this;      
  },
  
  setup_show_zone: function(){
    this.show_zone = $(this.options.show_zone_element) || new Element('div', {'class': this.options.show_zone_class}).inject(this.element, 'top');
    this.show_zone_wrapper = new Element('div', {'class': this.options.show_zone_class + '_wrapper'}).wraps(this.show_zone);
    this.show_zone_controls = new Element('div', {'class': this.options.controls_class}).inject(this.show_zone_wrapper);    
    
    this.show_zone_controls.adopt(      
      ['prev','next','close'].map(function(button){
        return this[button + "_button"] = $(this.options[button + "_button_element"]) || new Element('a', {
          'class' : this.options[button + "_button_class"],
          'html'  : this.options[button + "_button_html"]
        });
      }, this)
    );
    
    this.fireEvent('showZoneCreated', [this.show_zone, this]);
    return this;
  },
  
  attach_events: function(){
    this.the_art.each(function(art,i){
      art.addEvent(this.options.show_event, this.show.bind(this,i));
    }, this);
    
    this.next_button.addEvent(this.options.next_event, this.next.bind(this));
    this.prev_button.addEvent(this.options.prev_event, this.prev.bind(this));    
    this.close_button.addEvent(this.options.close_event, this.close.bind(this));
    
    if (this.options.keyboard_nav && $defined(Keyboard)){
      this.keyboard = new Keyboard({
        preventDefault : true,
        events: {
          'j'     : this.next.bind(this),
          'k'     : this.prev.bind(this),
          'right' : this.next.bind(this),  
          'left'  : this.prev.bind(this),
          'p'     : this.toggle_pin_show_zone.bind(this)
        }
      });
    }
    
    if (this.options.auto_pin){
      this.original_show_zone_top = this.show_zone_wrapper.getTop();
      window.addEvent('scroll', function(){
        if (this.show_zone_wrapper.getTop() < window.getScrollTop())
          this.pin_show_zone();
        if (window.getScrollTop() < this.original_show_zone_top)
          this.unpin_show_zone();
      }.bind(this));
    }
    
    return this;    
  },
  
  setup_effects: function(){
    if ($defined(Fx.Slide)){
      this.the_slide = new Fx.Slide(this.show_zone, {
        duration   : 300,
        onComplete : function(){
          this.fireEvent(this.is_open ? 'open' : 'close');
          if (this.is_open)
            this.show_zone_wrapper.addClass(this.options.show_zone_open_class);
        }.bind(this)
      });
    }
  },
  
  remove_art: function(art){
    this.the_art.erase(art);
  },
  
  show: function(index){ 
    var modified_index = false;
    
    if (this.options.cycle)
      this.current_art = this.the_art.cycle(index);
    else {
      var limited = index.limit(0, this.the_art.length - 1);
      
      if (index <= 0) 
        this.prev_button.addClass(this.options.disabled_button_class);
      else
        this.prev_button.removeClass(this.options.disabled_button_class);

      if (index >= this.the_art.length - 1) 
        this.next_button.addClass(this.options.disabled_button_class);
      else
        this.next_button.removeClass(this.options.disabled_button_class);
      
      if (index !== limited){          
        index = limited;        
        modified_index = true;
      }    
        
      this.current_art = this.the_art[index];
    }
    
    if (this.options.toggle && !modified_index && index === this.showing_index && this.is_open)
      return this.close();
      
    if (!this.is_open)
      this.open();
    
    if ($defined(index)){
      this.showing_index = index;
      
      this.options.show_zone_transition(
        this.show_zone, 
        this.current_art, 
        this.showing_index,
        this.options.update_show_zone.bind(this, [this.show_zone, this.current_art, this.showing_index])
      );
      
      if (this.options.superfluous_effects && $defined(Fx.Morph))
        this.superfluous_effects(this.current_art);

      this.the_art.removeClass(this.options.active_art_class);
      this.current_art.addClass(this.options.active_art_class);
    }
    
    return this;
  },
  next: function(){
    return this.show(this.showing_index + 1);
  },
  prev: function(){
    return this.show(this.showing_index - 1);
  },
  
  open: function(){
    $try(
      this.options.custom_open,
      function(){
        if (this.the_slide){
          this.the_slide.hide();
          this.the_slide.slideIn();
        } else
          this.show_zone.setStyle('display','block');
      }.bind(this)
    );

    this.is_open = true;
    this.keyboard.activate();
    
    this.fireEvent('showZoneOpened', [this.show_zone, this]);
    return this;
  },
  close: function(){
    $try(
      this.options.custom_close,
      function(){
        if (this.the_slide){
          if (this.is_open)
            this.the_slide.slideOut();
          else
            this.the_slide.hide();
        } else
          this.show_zone.setStyle('display','none');
      }.bind(this)
    );

    if (this.current_art) this.current_art.removeClass(this.options.active_art_class);
    this.is_open = false;  
    this.show_zone_wrapper.removeClass(this.options.show_zone_open_class);    
    this.keyboard.deactivate();  
    this.unpin_show_zone();
    
    this.fireEvent('showZoneClosed', [this.show_zone, this]);
    return this;
  },
  
  superfluous_effects: function(art){
    var top    = art.getStyle('margin-top').toInt(),
        bottom = art.getStyle('margin-bottom').toInt();
        
    new Fx.Morph(art, {
      'property' : 'margin-top',
      'duration' : 50,
      'link'     : 'chain'
    }).start({'margin-top': top - 5, 'margin-bottom': bottom + 5}).start({'margin-top': top, 'margin-bottom': bottom});
  },
  
  pin_show_zone: function(){
    if (this.is_pinned) return this;
    
    this.filler = new Element('div', {
      styles: { 
        height : this.show_zone_wrapper.getHeight(),
        margin : this.show_zone_wrapper.getStyle('margin')
      }
    }).inject(this.show_zone_wrapper, 'after');
    this.show_zone_wrapper.setStyle('position','fixed')
                          .addClass(this.options.pinned_class);
    this.is_pinned = true;
    
    this.fireEvent('showZonePinned', [this.show_zone, this]);
    return this;
  },
  unpin_show_zone: function(){
    if (!this.is_pinned) return this;
    
    this.filler.destroy();
    this.show_zone_wrapper.setStyle('position','static')
                          .removeClass(this.options.pinned_class);
    this.is_pinned = false;   
    
    this.fireEvent('showZoneUnPinned', [this.show_zone, this]);
    return this; 
  },
  toggle_pin_show_zone: function(){
    this.is_pinned ? this.unpin_show_zone() : this.pin_show_zone();
    return this;
  }
});

window.addEvent('domready', function(){
  // supported: twitpic, yfrog, twitgoo, tweetphoto, img.ly
  // not:       mobypicture
  var twitter_image_regex = new RegExp(/(\w+:\/\/(yfrog|twitpic|twitgoo|tweetphoto|img)+\.[A-Za-z0-9-_:;\(\)%&\?\/.=]+)/);
  
	new MicroApp('twitter-and-flickr', [
		[ /*new Flickr({ 
				image_view_options : {
					width  : 133,
					height : 133 },
				json_url:"http://api.flickr.com/services/rest/", 
				json_opts: { data : { tags    : 'ninjacam', 
															method  : 'flickr.photos.search', 
															api_key : 'f31a8e4819faa5ec28ed3db580b76fb9',
															media   : 'photos',
															extras  : 'date_taken,owner_name,tags' } } }), */
		  new Twitter({
        initial_limit: 69,		    
        // user_name    : 'ninjacam',
        json_opts: { 
          data : { q : 'yfrog' },
          onFailure: function(){
            $('twitter-and-flickr').removeClass('loading').addClass('failed');
          }
        },
				shouldIncludeItem: function(item){
          var is_rt = item.text.match("RT @");
          // return (item.text.test(twitter_image_regex)) && (!is_rt || item.from_user == "ninjacam");
          return item.text.test(twitter_image_regex) && !is_rt;
				},
				gen_html: function(item){
				  var img_url = item.text.match(twitter_image_regex)[0],
				      src = img_url,
				      tweet_url = item.source;

				  if (img_url.test(/yfrog/))
            src += ".th.jpg";
				  else if (img_url.test(/twitpic/))
            src = "http://twitpic.com/show/thumb/" + img_url.match(/([^\/]+$)/)[0];
          else if (img_url.test(/twitgoo/))
            src = "http://twitgoo.com/show/thumb/" + img_url.match(/([^\/]+$)/)[0];
          else if (img_url.test(/tweetphoto/))
            src = "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=big&url=http://tweetphoto.com/" + img_url.match(/([^\/]+$)/)[0];            
          else if (img_url.test(/img.ly/))
            src = "http://img.ly/show/thumb/" + img_url.match(/([^\/]+$)/)[0];
            
          var tweet = item.text.replace(/http:\/\/[^\s]+|^RT\s@[^\s]+/g,"").replace(/#ninjacam\s*$/g,""),
              user  = $pick(item.rt_from, item.from_user),
              date  = "<a href='" + tweet_url + "' class='tweet-date'>" + Date.parse(item.created_at).timeDiffInWords() + "</a>",
              tweet_icon = "<a target='_blank' href='http://www.twitter.com/" + user + "'><img src='" + item.profile_image_url + "' class='tweet-user-image icon'/></a>",
              tweet_user = "<a class='tweet-user' target='_blank' href='http://www.twitter.com/" + user + "'>@" + user + "</a>";
            
          return "<img src='" + src + "'/>"
                 + "<div class='caption'>" 
                   + date + "<p class='tweet-text'>" + tweet 
                 + "</p><div>" + tweet_icon + tweet_user + "</div></div>";
				},
				onExtraRTInfoRecieved: function(item){
				  item.element.getElement('.tweet-user-image').set('src', item.rt_from_info.profile_image_url);
				}
			})
		]],
		{
		  onHtmlUpdated: function(){ 
		    $('twitter-and-flickr').removeClass('loading').getChildren('div.cell').each(function(cell){
		      var img_elem = cell.getFirst();
		      
          img_elem.thumbnail(114,114,'thumbnail icon');
          new Element('div', {'class': 'thumb-wrapper'}).inject(cell, 'top');          
          
          img_elem.addEvent('error', function(){
            try {
              var cell = this.getParent().getParent();
              the_louvre.remove_art(cell);
              cell.destroy();
            }catch(e){}
          });
          
          // turn thumbnail urls into full size for the various services
          (function(){
          cell.getFirst('.thumbnail').getFirst('img').mod('src', function(old_src){
            return old_src.replace(".th.jpg", ":iphone")
                          .replace("http://twitgoo.com/show/thumb/", "http://twitgoo.com/show/img/")            
                          .replace("http://twitpic.com/show/thumb/", "http://twitpic.com/show/large/")
                          .replace("http://img.ly/show/thumb/", "http://img.ly/show/full/");
          });
          }).delay(1000);
		    });
		    
        $('twitter-and-flickr').fade('in');
        
        the_louvre = new TheLouvre($('twitter-and-flickr'), {
          selector         : " .cell",
          show_image_class : "the_louvre_show_image icon",
          close_button_html: "⇧",
          next_button_html: "&gt;",
          prev_button_html: "&lt;",
          // initially_showing_index : 0, // todo fix
          get_img_src : function(the_art){
            return the_art.getFirst('.thumbnail').getFirst('img').get('src');
          },
          get_caption : function(the_art){
            return the_art.getFirst('.caption').get('html');
          },
          get_img_href : function(the_art, i){            
            return the_art.retrieve('data').text.match(twitter_image_regex)[0];
          }
        });
		  }
		}
	).to_html();
});
