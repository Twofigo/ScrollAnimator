function setup(){
    var animator = scrollAnimator.newAnimator(document.getElementById("box"));
    var pLeft = animator.addAnimation("left");
    pLeft.addKeyframe(100,300);
    pLeft.addKeyframe(400,1500);
    pLeft.addKeyframe(10,6000);
    
    scrollAnimator.init();
}

var scrollAnimator = (function(){

    var animators = [];
    
    var syntaxFunctions = {};
    syntaxFunctions.distance = function(dom, attribute, value){
        dom.style[attribute]= value+"px";
    }
    
    var transissions = {};
    transissions.linear = function(timeStamp){
        return timeStamp;
    }
    transissions.constant = function(timeStamp){
        return 0;
    }
    
    var init = function(){
       window.addEventListener('scroll', update)
 
    }
    
    var update = function(){
        for (a of animators){
            a.update(document.body.scrollTop);
        }
    }
    
    var newAnimator = function(dom){
        var animator = new Animator(dom);
        animators.push(animator)
        return animator;
    }

    var Animator = function(dom){
       this.dom = dom;
       this.animations = [];
    }
    Animator.prototype.clone = function(){
       var t = new Animator(this.dom);
       for (a of this.animations){
            t.add(a.clone())
       }
       return t;
    }
    Animator.prototype.addAnimation = function(attribute, syntaxMode=false){     
        var animation = new Animation(attribute, syntaxMode);
        this.animations.push(animation);
        return animation;
    }
    Animator.prototype.update = function(timeStamp){
        for (a of this.animations){
            a.update(this.dom, timeStamp)
        }
    }
    
    var Animation = function(attribute, syntaxMode=false){
        this.attribute = attribute;
        this.keyframes = [];
        
        if (syntaxMode.typeof)this.syntaxFunction;
        
        
        this.addKeyframe(0,0);
        
        
        this._keyframe;
        this._valueDiff;
        this._timeDiff;
    }
    Animation.prototype.clone = function(){
       var t = new Animation(this.cssAttribute);
       t.syntaxFunction = this.syntaxFunction;
       for(k in this.keyframe){
            t.addKeyframe(k.clone());
       }
       return t;
    }
    Animation.prototype.addKeyframe = function(value, timeStamp, transission = transissions.linear){
        var keyframe = new Keyframe(value, timeStamp, transission)
        this.keyframes.push(keyframe);
        this.keyframes.sort(function(a,b){return a.timeStamp - b.timeStamp});
        return keyframe;
    }
    Animation.prototype.update = function(dom, timeStamp){
        
        if(!this._keyframe || this._keyframe.timeStamp>timeStamp || (this._keyframe.timeStamp+this._timeDiff)<timeStamp){
            var last_keyframe = false;
            var next_keyframe = false;
            for(k of this.keyframes){
                if (k.timeStamp > timeStamp){
                    next_keyframe = k;
                    break;
                }
                last_keyframe = k;
            }
            this._keyframe = last_keyframe;
            if  (next_keyframe){
                this._timeDiff = next_keyframe.timeStamp - last_keyframe.timeStamp;
                
                this._valueDiff = false;
                for(key in this._keyframe.value){
                     this._valueDiff[key] = next_keyframe.value[key] - last_keyframe.value[key];
                }
                if (!this._valueDiff){
                     this._valueDiff = next_keyframe.value - last_keyframe.value;
                }
            }
            else{
                this._valueDiff = false;
                this._timeDiff = false;
            }
        }
        
        var v;
            
        if (this._valueDiff){
            var factor = this._keyframe.transission((timeStamp-this._keyframe.timeStamp)/this._timeDiff);
            
            for(key in this._keyframe.value){
                 v[key] = this._valueDiff[key]*factor;
                 v[key] += this._keyframe.value[key];
            }
            if (!v){
                 v = this._valueDiff*factor;
                 v += this._keyframe.value;
            }
        }
        else{
            v = this._keyframe.value;
        }    
        
        syntaxFunctions.distance(dom, this.attribute, v);
    }
    
    var Keyframe = function(value, timeStamp, transission = transissions.linear){
        this.value = value;
        this.timeStamp = timeStamp;
        this.transission = transission;
    }
    Keyframe.prototype.clone = function(){
       var t = new Keyframe(value, timeStamp, this.transissionFunc);
       return t;
    }
    
    return {
        init: init,
        animators: animators,
        newAnimator: newAnimator,
    };
})();