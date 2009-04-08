window.addEvent('domready', function(){
	new MicroApp('twitter-and-flickr', [
		[ new Flickr({ 
				json_url:"http://api.flickr.com/services/rest/", 
				json_opts: { globalFunction : 'jsonFlickrApi', 
										 data : { tags    : 'ninjacam', 
															method  : 'flickr.photos.search', 
															api_key : 'f31a8e4819faa5ec28ed3db580b76fb9',
															media   : 'photos',
															extras  : 'date_taken,owner_name,tags' } } }), 
		  new Twitter({ user_name:'ninjacam' }) 
		]
	]).to_html()
})