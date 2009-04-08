window.addEvent('domready', function(){
	new MicroApp('twitter-and-flickr', [
		[ new Flickr({ 
				image_view_options : {
					width  : 150,
					height : 150 },
				json_url:"http://api.flickr.com/services/rest/", 
				json_opts: { globalFunction : 'jsonFlickrApi', 
										 data : { tags    : 'ninjacam', 
															method  : 'flickr.photos.search', 
															api_key : 'f31a8e4819faa5ec28ed3db580b76fb9',
															media   : 'photos',
															extras  : 'date_taken,owner_name,tags' } } }), 
		  new Twitter({ 
				user_name    : 'ninjacam', 
				show_twitpic : true }) 
		]]
	).to_html()
})