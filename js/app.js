var TheLouvre = new Class({
  Implements: [Options, Events],
  
  options: {
    selector     : "img",
    show_event   : "click",
    show_zone_id : "the_louvre_show_zone",
    show_image_class   : "the_louvre_show_image",
    show_caption_class : "the_louvre_show_caption",    
    active_art_class   : "the_louvre_showing",
    iniitially_showing_index: null,   
    toggle : true,

    get_img_src : function(the_art){
      return the_art.get('src');
    },
    get_caption : function(the_art){
      return "";
    },
    update_show_zone: function(show_zone, the_art, index){
      show_zone.set('html','').adopt([
        new Element('img', {'class': this.options.show_image_class, 'src': this.options.get_img_src(the_art, index)}),
        new Element('p',   {'class': this.options.show_caption_class, 'html': this.options.get_caption(the_art, index)})
      ]);
    }
  },
  
  initialize: function(elem, options){
    this.setOptions(options);
    this.element = elem;
    this.the_art = this.element.getElements(this.options.selector);
    this.show_zone = this.options.show_zone_element || new Element('div', {'id': this.options.show_zone_id}).inject(this.element, 'top');
    
    this.attach_events();
    
    if ($defined(Fx.Slide))
      this.the_slide = new Fx.Slide(this.show_zone, {
        onComplete: function(){
          this.fireEvent(this.is_open ? 'open' : 'close');
        }.bind(this)
      });
    
    if ($chk(this.options.iniitially_showing_index)){
      this.is_open = true;
      this.show(this.options.iniitially_showing_index);
    } else
      this.close();
      
    return this;      
  },
  
  attach_events: function(){
    this.the_art.each(function(art,i){
      art.addEvent(this.options.show_event, this.show.bind(this,i));
    }, this);
    return this;    
  },
  
  show: function(index){    
    if (this.options.toggle && index === this.showing_index && this.is_open)
      return this.close();
    if (!this.is_open)
      this.open();
    
    if ($defined(index)){
      this.showing_index = index;
      this.options.update_show_zone.call(this, this.show_zone, this.the_art[this.showing_index], this.showing_index);

      this.the_art.removeClass(this.options.active_art_class);
      this.the_art[this.showing_index].addClass(this.options.active_art_class);
    }
    
    return this;
  },
  open: function(){
    // attach key events

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
    
    return this;
  },
  close: function(){
    // detach key events
    
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

    this.is_open = false;    
    
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
        user_name    : 'ninjacam',
				show_twitpic : true,
				shouldIncludeItem: function(item){
				  return item.text.test(twitter_image_regex);
				},
				gen_html: function(item){				  
				  var url = item.text.match(twitter_image_regex)[0];

				  if (url.test(/yfrog/))
            url += ".th.jpg";
				  else if (url.test(/twitpic/))
            url = "http://twitpic.com/show/thumb/" + url.match(/([^\/]+$)/)[0];
          else if (url.test(/twitgoo/))
            url = "http://twitgoo.com/show/thumb/" + url.match(/([^\/]+$)/)[0];
          else if (url.test(/tweetphoto/))
            url = "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=big&url=http://tweetphoto.com/" + url.match(/([^\/]+$)/)[0];            
          else if (url.test(/img.ly/))
            url = "http://img.ly/show/thumb/" + url.match(/([^\/]+$)/)[0];
            
          return "<img src='" + url + "'/><p>" + item.text.replace(/http:\/\/[^\s]+|^RT|@[^\s]+/g,"").replace(/#ninjacam\s*$/g,"") + "</p>";
				}
			})
		]],
		{
		  onHtmlUpdated: function(){ 
		    $('twitter-and-flickr').getChildren('div.cell').each(function(cell){
          cell.getFirst().thumbnail(114,114,'thumbnail icon');
          new Element('div', {'class': 'thumb-wrapper'}).inject(cell, 'top');          
          
          // turn thumbnail urls into full size for the various services
          cell.getFirst('.thumbnail').getFirst('img').mod('src', function(old_src){
            return old_src.replace(".th.jpg", ":iphone")
                          .replace("http://twitgoo.com/show/thumb/", "http://twitgoo.com/show/img/")            
                          .replace("http://twitpic.com/show/thumb/", "http://twitpic.com/show/large/")
                          .replace("http://img.ly/show/thumb/", "http://img.ly/show/full/");
          });
		    });
		    
        $('twitter-and-flickr').fade('in');
        
        new TheLouvre($('twitter-and-flickr'), {
          selector         : " .cell",
          show_image_class : "the_louvre_show_image icon",
          // iniitially_showing_index : 0,          
          get_img_src      : function(the_art){
            return the_art.getFirst('.thumbnail').getFirst('img').get('src');
          },
          get_caption      : function(the_art){
            return the_art.getFirst('p').get('text');
          }
        });
		  }
		}
	).to_html();
});

// image expansion UX options
// lightboner style, click and it gets bigger up above with the metadata to the right.
// maybe do like: click an image it expands in place, then as you hover over others they expand in place as well.