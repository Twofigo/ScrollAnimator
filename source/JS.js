function setup(){
    
    
}

var scrollAnimator = (function(){
    var objects = [];
    
    var init = function(){
        var self = this;
        document.body.addEventListener("scroll", self.update);
    }
    
    var update = function(){
        for (obj of objects){
            obj.update(document.scrollTop)
        }
    }
    
    var newAnimator = function(dom){
        var animator = new Animator(dom);
        objects.push(animator)
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
    Animator.prototype.add = function(attribute){
        this.animations.push(attribute);
    }
    Animator.prototype.add = function(cssAttribute, valueObj, unit=false, inline=false){
        if (unit == false){ // switch statement for autodetect
            
        }            
        this.add(new Animation(cssAttribute, valueObj, unit));
    }
    Animator.prototype.update = function(TimeStamp){
        for (a of this.animations){
            a.update(this.dom, timeStamp)
        }
    }
    
    var Animation = function(cssAttribute, valueObj, unit, transissionFunc){
        this.cssAttribute = cssAttribute;
        this.valueObj = valueObj;
        this.unit = unit || false;
        this.keyframes = [];
    }
    Animation.prototype.clone = function(){
       var t = new Animation(this.cssAttribute, this.valueObj, this.unit, this.transissionFunc, this.inline);
       return t;
    }
    Animation.prototype.addKeyframe(keyframe){
        this.keyframes.push(keyframe);
        this.keyframes.sort(function(a,b){return a.timeStamp - b.timeStamp});
    }
    Animation.prototype.addKeyframe(value, timeStamp, transissionFunc){
        this.addKeyframe(new Keyframe(value, timeStamp, transissionFunc));
    }
    Animation.prototype.update = function(dom, timeStamp){
        var last_keyframe = false;
        var next_keyframe = false;
        for(k in this.keyframe){
            if (k.timeStamp > timeStamp){
                if (!last_keyframe){
                    last_keyframe = k;
                    continue;
                }
                next_keyframe = k;
                break;
            }
        }
        
        var valueDiff = next_keyframe.value - last_keyframe.value;
        var timeDiff = next_keyframe.timeStamp - last_keyframe.timeStamp;
        var string;
        string = (timeStamp-last_keyframe.timeStamp)/timeDiff;
        if (last_keyframe.transissionFunc){
            string = last_keyframe.transissionFunc(string)
        }
        string *= valueDiff;
        string += last_keyframe.value;
        string += unit;
        dom.style['this.cssAttribute']= string;
    }
    
    var Keyframe = function(value, timeStamp, transissionFunc){
        this.value = value;
        this.timeStamp = timeStamp;
        this.transissionFunc = transissionFunc || false;
    }
    Keyframe.prototype.clone = function(){
       var t = new Keyframe(value, timeStamp, this.transissionFunc);
       return t;
    }
    
    return {
        init: init,
        newAnimator: newAnimator,
    };
})();