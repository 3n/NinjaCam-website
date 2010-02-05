G = {};

var setup_video_hud = function(){
  var show_video_hud = function(){ $('video-hud').setStyle('display','block'); G.keyboard.activate(); };
	var hide_video_hud = function(){ $('video-hud').setStyle('display','none');  G.keyboard.deactivate(); };
	
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
};

var add_browser_classes = function(){
  if (!Browser.Engine.webkit) $(document.body).addClass('crap-browser');
  if (Browser.Engine.gecko) $(document.body).addClass('moz');
};

window.addEvent('domready', function(){
  add_browser_classes();
  
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
        initial_limit: 32,		    
        // user_name    : 'ninjacam',
        json_opts: { 
          data : { q : 'tweetphoto' },
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
		    $('twitter-and-flickr').removeClass('loading').getChildren('div.cell').each(function(cell){
		      var img_elem = cell.getFirst();
          
          img_elem.setStyle('visibility','hidden');
          
          img_elem.addEvent('error', function(){
            try {
              var tmp = this.getParent();
              if (tmp.hasClass('cell'))
                tmp.destroy();
              else
                tmp.getParent().destroy();
            }catch(e){}
          });
          
          img_elem.addEvent('load', function(){
            this.setStyle('visibility','visible').thumbnail(114,114,'thumbnail icon');
            new Element('div', {'class': 'thumb-wrapper'}).inject(cell, 'top');
            this.removeEvents('load');

            (function(){
            this.mod('src', function(old_src){
              return old_src.replace(".th.jpg", ":iphone")
                            .replace("http://twitgoo.com/show/thumb/", "http://twitgoo.com/show/img/")            
                            .replace("http://twitpic.com/show/thumb/", "http://twitpic.com/show/large/")
                            .replace("http://img.ly/show/thumb/", "http://img.ly/show/full/");
            });
            }).delay(100, this);
          });
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
	
  setup_video_hud();
});
