window.addEvent('domready', function(){
	new MicroApp('twitter-and-flickr', [
		[ new Flickr({ 
				json_url:"http://api.flickr.com/services/rest/", 
				json_opts: { globalFunction : 'jsonFlickrApi', 
										 data : { tags: 'ninjacam', method: 'flickr.photos.search', api_key:'3d960379f9db3179ab40c45473ca0e9d' } } }), 
		  new Twitter({ user_name:'ninjacam' }) 
		]
	]).to_html()
})