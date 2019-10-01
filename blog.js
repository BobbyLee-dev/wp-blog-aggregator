// start rest api
var wpRestApiObj = {

  init: function () {
    var sourceUrls = []
    var isBlog = this.selectors.isBlog();
    var postsWrap;
    if(isBlog) {
      postsWrap = document.querySelector('article.content');
    } else {
      postsWrap = document.querySelector('.latest-posts');
    }
    var loader = document.createElement('div');
    loader.classList.add('loader');

    postsWrap.appendChild(loader);

    // Get all urls passed into getPosts and put them in the sourceUrls Array;
    for (var i = 0; i < arguments.length; i++) {
      sourceUrls.push(arguments[i]);
    }
    this.getPosts(sourceUrls);
  },

  selectors: {
    isBlog: function() {

      var isBlog = document.querySelector('.blog');
      console.log(isBlog);
      return isBlog;
    },

    recentPosts: function() {
      var recentPosts = document.querySelector('.upper-footer');
      return recentPosts;
    },

  },

  getPosts: function(sourceUrls) {
    var postsArr = [];
    var httpRequestCount = 0;
    var postsCurrentlyOnPage = document.querySelectorAll('.post-snippet .blog-title a');
    var totalPostsOnAllSites = 0;

    // Start query.
    sourceUrls.forEach(function (source) {
      // number of posts to start from on query.
      var offSet = 0;

      // Get what post to start on for the new request - first find out how many are currently on the page.
      postsCurrentlyOnPage.forEach(function(item) {
        var linkAsString = item.href;
        if(linkAsString.includes(source)) {
          offSet++;
        }
      })

      // Get 10 posts starting at the offSet
      var url = source + '/wp-json/wp/v2/posts?_embed&per_page=10&offset=' + offSet;

      fetch(url)
        .then(function(response) {

          // The total number of posts for current site/url - source
          totalPostsOnAllSites += parseInt(response.headers.get('X-WP-Total'));

          return response.json();
        })
        .then(function(posts) {
          posts.forEach(function (post) {
            var isPublished = post.status;
            if (isPublished === 'publish') {
              postsArr.push(post);
            }
          });

          httpRequestCount++;

          // if this is the last url/fetch request
          if (httpRequestCount === sourceUrls.length) {
            // Sort the array now that it's full

            postsArr.sort(function (a, b) {
              a = new Date(a.date);
              b = new Date(b.date);
              return a > b ? -1 : a < b ? 1 : 0;
            });
            return wpRestApiObj.displayPosts(postsArr, totalPostsOnAllSites);
          }
        })
        .catch(function(error) {
          console.log(error);
        });
    });

  },



  displayPosts: function(posts, totalPostsOnAllSites) {
    var loader = document.querySelector('.loader');
    var isBlog = this.selectors.isBlog();
    var postsWrap;
    if(isBlog) {
      postsWrap = document.querySelector('article.content');
    } else {
      postsWrap = document.querySelector('.latest-posts');
    }

    postsWrap.removeChild(loader);
    posts.forEach(function (post, index) {

      var numberToShow = isBlog ? 10 : 4;

      if (index < numberToShow) {
        // var theme_path = rm_data.tmplDirUri;
        var site_path = rm_data.siteUrl;

        var postSnippet = document.createElement('article');
        var fromExternal = post.link.includes('austinmohssurgery');
        var featuredImgWrap = document.createElement('div');
        var postExcerptWrap = document.createElement('div');
        var title = document.createElement(isBlog ? 'h2' : 'div');
        var metaData = document.createElement('div');
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var month = months[parseInt(post.date.substring(5, 7)) - 1];
        var day = post.date.substring(8, 10);
        var year = post.date.substring(0, 4);
        var postCategories = post._embedded['wp:term'][0];
        var postLink = post.link;
        var blank = fromExternal ? 'target="_blank"' : "";
        var externalTxt = fromExternal ? ' On Austin Mohs' : '';
        var readMore = '<a href="' + postLink + '" class="more" ' + blank + ' >Continue Reading' + externalTxt + '</a>';
        var externalLogo = '<div class="external-logo">From: <a href="https://www.austinmohssurgery.com/" target="_blank"><img alt="Austin Mohs Logo" src="'+site_path+'/wp-content/uploads/2019/06/mohs-logo.png"></a></div>';

        // Make Featured Media element
        if (post.featured_media > 0) {
          featuredImgWrap.classList.add('thumb');
          featuredImgWrap.style.backgroundImage = "url('"+ post._embedded['wp:featuredmedia']['0'].source_url +"')";
        }

        // Make Content element

        // Post Title
        title.classList.add('blog-title');
        if(isBlog) {
          title.innerHTML = '<a href="' + postLink + '" ' + blank + ' >' + post.title.rendered + '</a>';
        } else {
          title.innerHTML = '<div class="footer-post-title">' + post.title.rendered + '</div>';
        }

        // Post Meta data
        metaData.classList.add('meta-data');
        metaData.innerHTML = month + ' ' + day + ', ' + year;

        // Excertp Wrap
        postExcerptWrap.classList.add('excerpt');

        if(fromExternal) {
          postExcerptWrap.innerHTML += externalLogo;
        }

        postExcerptWrap.appendChild(title);
        postExcerptWrap.appendChild(metaData);

        postExcerptWrap.innerHTML += post.content.rendered.split(' ').slice(0, 100).join(' ') + '... ' + readMore;

        // Make Post Element
        if (fromExternal) {
          postSnippet.classList.add('from-external');
        }

        postSnippet.classList.add('post-snippet');

        // Add Featured Image to Post Element
        if (post.featured_media > 0) {
          postSnippet.appendChild(featuredImgWrap)
        };

        // Add content to Post Element
        postSnippet.appendChild(postExcerptWrap);

        if (isBlog) {
          postsWrap.appendChild(postSnippet);
        } else {
          var liEl = document.createElement('li');
          var liLink = document.createElement('a');

          liLink.href = postLink;

          liLink.appendChild(postSnippet);
          liEl.appendChild(liLink);
          if(fromExternal) {
            liLink.target = '_blank'
            liLink.innerHTML += '<strong>From Austin Mohs Surgery</strong>';
          }
          postsWrap.appendChild(liEl);
        }
      }
    });
    if(isBlog) {
      this.showMorePostsBtn(totalPostsOnAllSites);
    }
  },


  showMorePostsBtn: function (totalPostsOnAllSites) {

    var moreBtns = document.querySelectorAll('.show-more-posts');

    if (moreBtns.length > 0) {
      moreBtns.forEach(function (btn) {
        btn.style.display = 'none';
      });
    }

    var displayedPostsNumber = document.querySelectorAll('.post-snippet .blog-title a');
    var allPostsWrap = document.querySelector('article.content');
    var howManyMore = totalPostsOnAllSites - displayedPostsNumber.length;
    var showMoreBtn = document.createElement('button');
    var showMoreBtnTxt = howManyMore > 1 ?  'are' : 'is';
    showMoreBtn.innerText = 'Show More Posts, there ' + showMoreBtnTxt + ' ' + howManyMore + ' more.';
    showMoreBtn.classList.add('show-more-posts');
    showMoreBtn.classList.add('button');
    showMoreBtn.onclick = initApiQuery;

    if (displayedPostsNumber.length < totalPostsOnAllSites) {
      allPostsWrap.appendChild(showMoreBtn);
    }
  }

}



