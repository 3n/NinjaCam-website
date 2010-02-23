Element.implement({
  'mouseDownClass' : function(class_name){
    var class_name = class_name || 'mousedown';
    this.addEvents({
      'mousedown': this.addClass.bind(this, class_name),
      'mouseup':   this.removeClass.bind(this, class_name)      
    });
  },
  add_class_for_duration : function(class_name, duration){
    this.addClass(class_name);
    this.removeClass(class_name).delay(duration, this);
  }
});



G = {

  twitter_image_regex : new RegExp(/(\w+:\/\/(yfrog|twitpic|twitgoo|tweetphoto|img|flic)+\.[A-Za-z0-9-_:;\(\)%&\?\/.=]+)/),
  
  trackEvent : function(category, action, label, value){    
    if (typeof(pageTracker) == "object") pageTracker._trackEvent(category, action, label, value);
    else if(typeof(_gaq) == "object") _gaq.push(['_trackEvent', category, action, label, value]);

    if (console && console.log)
      console.log($A(arguments).join(", "));
  },
  
  setup_video_hud : function(){
    var show_video_hud = function(){ 
      $('video-hud').setStyle('display','block'); 
      G.keyboard.activate();
      G.trackEvent("Video", "shown");
    };
  	var hide_video_hud = function(){ 
  	  $('video-hud').setStyle('display','none');  
  	  G.keyboard.deactivate(); 
  	  G.trackEvent("Video", "hidden");
  	};

    G.keyboard = new Keyboard({
      preventDefault : true,
      events: {
        'esc' : hide_video_hud
      }
    });

  	$('video-wrapper').addEvent('click', function(e){ e.stop(); });
  	$('video-wrapper').getFirst('a').addEvent('click', hide_video_hud);
  	$('watch-video').addEvent('click', show_video_hud);	
  	$('video-hud').addEvent('click', hide_video_hud);
  },
  
  add_browser_classes : function(){
    if (!Browser.Engine.webkit) $(document.body).addClass('crap-browser');
    else                        $(document.body).addClass('webkit');
    if (navigator.userAgent.test('Chrome')) $(document.body).addClass('chrome');
    if (Browser.Engine.gecko) $(document.body).addClass('moz');
    if (navigator.userAgent.test('Windows')) $(document.body).addClass('windowz');
  },
  
  add_tracking : function(){
    ['buy-wrapper', 'new', 'on-iphone'].each(function(id){
      $(id).addEvent('click', function(){
        G.trackEvent("Click", id, 'buy');
      });
    });
    ['twitter-follow-1','twitter-follow-2','twitter-follow-3'].each(function(id){
      $(id).addEvent('click', function(){
        G.trackEvent("Click", this.get('id'), 'social');
      });
    });
  }
  
};


MicroAppModel.implement({
	_item_is_new: function(creation_date, name){
		return Date.parse(creation_date) > Date.parse(G.grid_latest.get('twitter'));
	}
});


window.addEvent('domready', function() { G.dom_ready = true; });

window.onerror = function(msg, url, linenumber){   
	var handle_error = function(msg, url, linenumber) {
		G.trackEvent(
      "Error",
      msg,
      navigator.userAgent,
      linenumber
    );		
	};

	if (GLOBALZ.dom_ready) handle_error(msg, url, linenumber);
	else									 window.addEvent('domready', handle_error.bind(window, [msg, url, linenumber]));
};





window.addEvent('domready', function(){
  G.add_browser_classes();
  
  if (!$defined(Cookie.read('grid_latest'))) $(document.body).addClass('all-new');
	G.grid_latest = new Hash.Cookie('grid_latest', {duration:100, path: '/'});
  
  (function(){
    G.setup_video_hud();
    G.add_tracking();
    $('logo').addEvent('mouseover', function(){ $('eye').addClass('hover'); });
    $('logo').addEvent('mouseout',  function(){ $('eye').removeClass('hover'); });    

    var is_rotated = false;
    $$('.eye').addEvent('click', function(e){
      $('wrapper').getChildren().each(function(elem){
        var degreez = is_rotated ? 0 : elem.get_transform_int() + Math.random()*30*(coin_toss() ? 1 : -1);
        elem.rotate(degreez,{
    			duration   : 1000,
    			transition : 'ease-in-out'
    		});
      });
      is_rotated = !is_rotated;
  	});
  }).delay(1000);
  
  // supported: twitpic, yfrog, twitgoo, tweetphoto, img.ly, flic.kr
  // not:       mobypicture
  
	G.micro_app = new MicroApp('twitter-and-flickr', [
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
        initial_limit: 40,		    
        // user_name    : 'ninjacam',
        json_opts: {           
          data : { q : '#ninjacam', rpp  : 100 },
          onComplete : function(d){
            G.d = d;
          },
          onFailure: function(){
            if (!G.d){
              $('twitter-and-flickr').removeClass('loading').addClass('failed');
              G.trackEvent("Twitter", "failed");
            }
          }
        },
				shouldIncludeItem: function(item){
          var is_rt = item.text.match("RT @");
          // return (item.text.test(G.twitter_image_regex)) && (!is_rt || item.from_user == "ninjacam");
          return item.text.test(G.twitter_image_regex) && !is_rt;
				},
				gen_html: function(item){
          if (!item.is_new) $(document.body).addClass('show-new');
				  
				  var img_url = item.text.match(G.twitter_image_regex)[0],
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
          else if (img_url.test(/flic.kr/))
            src = "http://flic.kr/p/img/" + img_url.match(/([^\/]+$)/)[0] + "_m.jpg";
            
          var tweet = item.text.replace(/http:\/\/[^\s]+|^RT\s@[^\s]+/g,"").replace(/#ninjacam\s*$/g,""),
              user  = $pick(item.rt_from, item.from_user),
              date  = "<a href='" + tweet_url + "' class='tweet-date'>" + Date.parse(item.created_at).timeDiffInWords() + "</a>",
              tweet_icon = "<a target='_blank' href='http://www.twitter.com/" + user + "'><img src='" + item.profile_image_url + "' class='tweet-user-image icon'/></a>",
              tweet_user = "<a class='tweet-user' target='_blank' href='http://www.twitter.com/" + user + "'>@" + user + "</a>";
            
          return   "<img src='" + src + "'/>"
                 + "<div class='caption'>" 
                    + date 
                    + "<p class='tweet-text'>" + tweet + "</p>" 
                    + "<div>" + tweet_icon + tweet_user + "</div>" 
                 + "</div>";
				},
				onExtraRTInfoRecieved: function(item){
				  item.element.getElement('.tweet-user-image').set('src', item.rt_from_info.profile_image_url);
				}
			})
		]],
		{
		  onHtmlUpdated: function(){ 
		    var recent_ninjas = [];
		    $('twitter-and-flickr').removeClass('loading').getChildren('div.cell').each(function(cell,i){          
		      var img_elem = cell.getFirst();
          
          cell.setStyle('visibility','hidden');
          img_elem.setStyle('display','none');
          
          img_elem.addEvent('error', function(){
            if (console && console.log) console.log('image load error', this.get('src'));
            try {
              var tmp = this.getParent();
              if (tmp.hasClass('cell'))
                tmp.destroy();
              else
                tmp.getParent().destroy();
            }catch(e){}
          });
          
          var loaded_image = function(){
            this.setStyle('display','block');
            this.thumbnail(114,114,'thumbnail icon');
            new Element('div', {'class': 'thumb-wrapper'}).inject(cell, 'top');
            cell.setStyle('visibility','visible');

            var large_src = this.get('src').replace(".th.jpg", ":iphone")
                                           .replace("http://twitgoo.com/show/thumb/", "http://twitgoo.com/show/img/")            
                                           .replace("http://twitpic.com/show/thumb/", "http://twitpic.com/show/large/")
                                           .replace("http://img.ly/show/thumb/", "http://img.ly/show/full/");
                                           // .replace(/http:\/\/flic.kr\/p\/img\/([^\/]+)\.jpg$/, "http://flic.kr/p/img/$1_m.jpg");
            
            this.store('large_src', large_src);
            
            new Asset.image(large_src);
            
            // (function(){
            // this.mod('src', function(old_src){
            //   return old_src.replace(".th.jpg", ":iphone")
            //                 .replace("http://twitgoo.com/show/thumb/", "http://twitgoo.com/show/img/")            
            //                 .replace("http://twitpic.com/show/thumb/", "http://twitpic.com/show/large/")
            //                 .replace("http://img.ly/show/thumb/", "http://img.ly/show/full/");
            // });
            // }).delay(100, this);
          }.bind(img_elem);
          
          if (img_elem.complete) 
            loaded_image.call(img_elem);
          else
            img_elem.addEventOnce('load', loaded_image);
          
          if (cell.retrieve('data').from_user !== "ninjacam")
            recent_ninjas.include(cell.retrieve('data').from_user);
		    });
		    
		    $("recent-contributers").adopt([
		      recent_ninjas.map(function(rn){
		        return new Element('a', {
              html: "@" + rn,
              href: "http://www.twitter.com/" + rn,
              target: "_blank"
            });
		      }).first(15)
		    ]);
		    
        $('twitter-and-flickr').fade('in');
        
        the_louvre = new TheLouvre($('twitter-and-flickr'), {
          selector         : " .cell",
          show_image_class : "the_louvre_show_image icon icon-extra",
          close_button_html: "⇧",
          next_button_html: "&gt;",
          prev_button_html: "&lt;",
          // initially_showing_index : 0, // todo fix
          get_img_src : function(the_art){
            return the_art.getFirst('.thumbnail').getFirst('img').retrieve('large_src');
          },
          get_caption : function(the_art){
            return the_art.getFirst('.caption').get('html');
          },
          get_img_href : function(the_art, i){            
            return the_art.retrieve('data').text.match(G.twitter_image_regex)[0];
          },
          onShowZoneCreated: function(show_zone, the_louvre){
            $$('.the_louvre_button').mouseDownClass('mousedown');
          },
          onShown: function(the_art){
            if (the_art) the_art.removeClass('new');
          }
        });
        
        $('archives-link').setStyle('display','block');
		  }
		}
	).addEvent('modelInit', function(m){
			m.addEvent('dataReady', function(mm){
			  G.t = mm;
			  G.grid_latest.set( 'twitter', mm.db[0].created_on.toString());
			});
	})
  .to_html();
});
