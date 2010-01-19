window.addEvent('domready', function(){
  var twitter_image_regex = new RegExp(/(\w+:\/\/(yfrog|twitpic)+\.[A-Za-z0-9-_:;\(\)%&\?\/.=]+)/);
  
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
				  
          return "<img src='" + url + "'/><p>" + item.text.replace("#ninjacam","").replace(/http:\/\/[^\s]+/,"") + "</p>";
				}
			})
		]],
		{
		  onHtmlUpdated: function(){ 
		    $('twitter-and-flickr').getChildren('div.cell').each(function(cell){
          cell.getFirst().thumbnail(114,114,'thumbnail');
          // new Element('div', {'class': 'thumb-wrapper'}).wraps(cell.getFirst());
          new Element('div', {'class': 'thumb-wrapper'}).inject(cell.getFirst(),'bottom');
		    });
		    
        $('twitter-and-flickr').setStyle('visibility','visible');
		  }
		}
	).to_html();
});

// image expansion UX options
// lightboner style, click and it gets bigger up above with the metadata to the right.
// maybe do like: click an image it expands in place, then as you hover over others they expand in place as well.