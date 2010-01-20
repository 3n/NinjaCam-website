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
		  }
		}
	).to_html();
});

// image expansion UX options
// lightboner style, click and it gets bigger up above with the metadata to the right.
// maybe do like: click an image it expands in place, then as you hover over others they expand in place as well.