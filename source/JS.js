function setup(){
    var animator = scrollAnimator.newAnimator(document.getElementById("box"));
    var pLeft = animator.addAnimation("left", "distance");
    pLeft.addKeyframe(0,0);
    pLeft.addKeyframe(100,300);
    pLeft.addKeyframe(400,1500);
    pLeft.addKeyframe(10,6000);
    var bgColor = animator.addAnimation("backgroundColor", "color");
    bgColor.addKeyframe({r:0,g:0,b:255},0);
    bgColor.addKeyframe({r:0,g:255,b:255},100);
    bgColor.addKeyframe({r:255,g:0,b:0},3000);
    bgColor.addKeyframe({r:128,g:50,b:200},4000);
    
    var pLeft = animator.addAnimation("left", "distance");
    
    scrollAnimator.init();
}

var scrollAnimator = (function(){

    var animators = [];
    
    var syntaxFunctions = {};
    syntaxFunctions.distance = function(dom, attribute, value){
        dom.style[attribute]= value+"px";
    }
    syntaxFunctions.color = function(dom, attribute, value){
        if(!value.a)value.a=1;
        dom.style[attribute]= "rgba("+value.r+","+value.g+","+value.b+","+value.a+")";
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
    Animator.prototype.addAnimation = function(attribute, syntax){     
        var animation = new Animation(attribute, syntax);
        this.animations.push(animation);
        return animation;
    }
    Animator.prototype.update = function(timeStamp){
        for (a of this.animations){
            a.update(this.dom, timeStamp)
        }
    }
    
    var Animation = function(attribute, syntax){
        this.attribute = attribute;
        this.keyframes = [];
        this.syntax = syntax;
        
        
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
                
                if (!isFinite(this._keyframe.value)){
                    this._valueDiff = {};
                    for(key in this._keyframe.value){
                        this._valueDiff[key] = next_keyframe.value[key] - last_keyframe.value[key];
                    }
                }
                else{
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
            
            if (!isFinite(this._keyframe.value)){
                v = {};
                for(key in this._keyframe.value){
                    v[key] = this._valueDiff[key]*factor;
                    v[key] += this._keyframe.value[key];
                }
            }
            else{
                 v = this._valueDiff*factor;
                 v += this._keyframe.value;
            }
        }
        else{
            v = this._keyframe.value;
        }    
        
        syntaxFunctions[this.syntax](dom, this.attribute, v);
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