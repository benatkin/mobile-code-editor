(function() {
  
  var mce = window.mce = window.MobileCodeEditor = {};

  mce.File = Backbone.Model.extend({
    defaults: {
      
    },

    parse: function(resp, xhr) {
      return {text: resp};
    },

    url: function() {
      return '/index.html';
    },

    fetch: function(options) {
      options = options || {};
      var model = this;
      $.ajax({
        url: this.url(),
        success: function(resp, status, xhr) {
          model.set(model.parse(resp, xhr), options);
        },
        error: wrapError(options.error, model, options)
      });
    },

    allLines: function() {
      return this.get('text').split("\n");
    },

    getLines: function(start, end) {
      return this.allLines().slice(start, end + 1).join("\n");
    },

    setLines: function(start, end, text) {
      var allLines = this.allLines();
      console.log([start, end]);
      var startLines = allLines.slice(0, start);
      var endLines = allLines.slice(end + 1);
      this.set({'text': [startLines.join("\n"), text, endLines.join("\n")].join("\n")});
    }
  });

  mce.FileView = Backbone.View.extend({
    tagName: 'div',
    className: 'file-view',
    events: {
      'click li': 'click'
    },
    initialize: function() {
      _.bindAll(this, 'render', 'show', 'edit', 'cancelEdit', 'saveEdit');
      this.model.bind('change', this.render);
    },
    render: function() {
      this.$('pre').remove();
      $(this.el).remove();
      $(this.el).html('<pre class="prettyprint linenums hidden"></pre>');
      this.$('pre').text(this.model.get('text'));
      $('#main').append(this.el);
      prettyPrint(this.show);
    },
    show: function() {
      this.$('.prettyprint.hidden').removeClass('hidden');
      this.delegateEvents();
    },
    click: function(e) {
      if (this.editing) return;
      var line = $(e.target).closest('li');
      var lines = this.$('ol.linenums li');
      var index = lines.index(line);
      if (this.startLine !== undefined && this.endLine !== undefined) {
        if (index >= this.startLine && index <= this.endLine) {
          this.edit();
        } else {
          this.deselect();
        }
      } else if (this.startLine !== undefined) {
        this.endLine = index;
        if (this.endLine == this.startLine) {
          this.edit();
        } else {
          if (this.startLine > this.endLine) {
            var swap = this.startLine;
            this.startLine = this.endLine;
            this.endLine = swap;
          }
          lines.slice(this.startLine, this.endLine + 1).addClass('selected');
        }
      } else {
        line.addClass('selected');
        this.startLine = index;
      }
    },
    deselect: function() {
      this.$('li').removeClass('selected');
      this.startLine = this.endLine = undefined;
      this.editing = false;
      $('#editor').addClass('hidden');
    },
    edit: function() {
      this.editing = true;
      this.editText = this.model.getLines(this.startLine, this.endLine);
      $('#editor textarea').val(this.editText);
      $('#editor').css('top', (document.body.scrollTop + 4) + 'px').removeClass('hidden');
      $('#editor textarea').focus();

      var view = this;
      $('#editor form').submit(function(e) {
        e.preventDefault();
        view.saveEdit();
        return false;
      });
      $('#editor input.cancel').click(this.cancelEdit);
    },
    cancelEdit: function() {
      this.deselect();
    },
    saveEdit: function() {
      var text = $('#editor textarea').val();
      var startLine = this.startLine, endLine = this.endLine;
      this.deselect();
      if (startLine !== undefined && endLine !== undefined)
        this.model.setLines(startLine, endLine, text);
    }
  });

  mce.Controller = Backbone.Router.extend({
    routes: {
      "": "home"
    },

    home: function() {
      this.file = new mce.File();
      this.fileView = new mce.FileView({model: this.file, id: 'file-view-' + this.file.cid || this.file.id});
      this.file.fetch();
    }
  });

  $(document).ready(function() {
    mce.app = new mce.Controller();
    Backbone.history.start();
  });

  // from Backbone.js
  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(onError, model, options) {
    return function(resp) {
      if (onError) {
        onError(model, resp, options);
      } else {
        model.trigger('error', model, resp, options);
      }
    };
  };

})();