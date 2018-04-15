/*
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is "Simplenlg".
 *
 * The Initial Developer of the Original Code is Ehud Reiter, Albert Gatt and Dave Westwater.
 * Portions created by Ehud Reiter, Albert Gatt and Dave Westwater are Copyright (C) 2010-11 The University of Aberdeen. All Rights Reserved.
 *
 * Contributor(s): Ehud Reiter, Albert Gatt, Dave Wewstwater, Roman Kutlak, Margaret Mitchell.
 */


import NLGModule from '../framework/nlgmodule';
import InflectedWordElement from '../framework/inflectedWordElement';
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';
import StringElement from '../framework/stringElement';
import WordElement from '../framework/wordElement';
import ListElement from '../framework/listElement';
import DocumentElement from '../framework/documentElement';


import DocumentCategory from '../features/DocumentCategory';
import LexicalFeature from '../features/LexicalFeature';
import InternalFeature from '../features/InternalFeature';
import LexicalCategory from '../features/LexicalCategory';
import DiscourseFunction from '../features/DiscourseFunction';


class OrthographyProcessor extends NLGModule {
  
  constructor(){
    super();
    this.commaSepPremodifiers = true;
  }

  realise(element){
    let realisedElement = null;
    let func = null; //the element's discourse function
    //get the element's function first
    if(element instanceof ListElement){
      let children = element.getChildren();
      if(children.length != 0) {
        let firstChild = children[0];
        func = firstChild.getFeature('DISCOURSE_FUNCTION');
      }
    } else {
      if(element != null) {
        func = element.getFeature('DISCOURSE_FUNCTION');
      }
    }

    if(element != null){
      let category = element.getCategory();

      if(element instanceof DocumentElement) {
        let components = element.getComponents();

        switch(category){
        case DocumentCategory.SENTENCE :
          realisedElement = this.realiseSentence(components, element);
          break;

        case DocumentCategory.LIST_ITEM :
          if(components != null && components.length > 0) {
            // recursively realise whatever is in the list item
            // NB: this will realise embedded lists within list
            // items
            realisedElement = new ListElement(this.realise(components));
            realisedElement.setParent(element.getParent());
          }
          break;

        default :
          element.setComponents(this.realise(components));
          realisedElement = element;
        }

      } else if(element instanceof ListElement) {
        let buffer = "";

        if('PRE_MODIFIER' == func){

          let all_appositives = true;
          let children = element.getChildren();
          for (let x = 0; x < children.length; x++){
            let child = children[x];
            all_appositives = all_appositives && child.getFeatureAsBoolean('APPOSITIVE');
          }


          // TODO: unless this is the end of the sentence
          if(all_appositives){
            buffer += ", ";
          }

          buffer += this.realiseList(buffer, element.getChildren(), this.commaSepPremodifiers ? "," : "");
          if(all_appositives){
            buffer += ", ";
          }
        } else if('POST_MODIFIER' == func){

          let postmods = element.getChildren();

          for(let i = 0; i < postmods.length; i++ ){
            let postmod = postmods[i];

            // if the postmod is appositive, it's sandwiched in commas
            if(postmod.getFeatureAsBoolean('APPOSITIVE')){
              buffer += ", ";
              buffer += this.realise(postmod);

              if(i < postmods.length - 1){
                buffer += ", ";
              }
            } else {
              buffer += this.realise(postmod);
              if(postmod instanceof ListElement || (postmod.getRealisation() != null && postmod.getRealisation() != "")) {
                buffer += " ";
              }
            }
          }

        } else if(('CUE_PHRASE' == func || 'FRONT_MODIFIER' == func) && this.commaSepCuephrase){
          buffer += this.realiseList(buffer, element.getChildren(), this.commaSepCuephrase ? "," : "");
        } else {

          buffer += this.realiseList(buffer, element.getChildren(), "");
        }

        realisedElement = new StringElement(buffer);

      } else if(element instanceof CoordinatedPhraseElement) {
        realisedElement = this.realiseCoordinatedPhrase(element.getChildren());
      } else {
        realisedElement = element;
      }

      // make the realised element inherit the original category
      // essential if list items are to be properly formatted later
      if(realisedElement != null) {
        realisedElement.setCategory(category);
      }

      //check if this is a cue phrase; if param is set, postfix a comma
      if(('CUE_PHRASE' == func || 'FRONT_MODIFIER' == func) && this.commaSepCuephrase) {
        let realisation = realisedElement.getRealisation();

        if(!realisation.endsWith(",")) {
          realisation = realisation + ",";
        }

        realisedElement.setRealisation(realisation);
      }
    }

    //remove preceding and trailing whitespace from internal punctuation
    realisedElement = this.removePunctSpace(realisedElement);
    return realisedElement;
    
  }

  removePunctSpace(realisedElement) {

    let replaceAll = function(str, find, replace) {
      return str.replace(new RegExp(find, 'g'), replace);
    }

    if(realisedElement != null){
      let realisation = realisedElement.getRealisation();

      if(realisation != null) {
        realisation = replaceAll(realisation, " ,", ",");
        realisation = replaceAll(realisation, ",,", ",");
        realisation = replaceAll(realisation, "  ", " ");
        realisedElement.setRealisation(realisation);
      }
    }
    return realisedElement;
  }

  realiseSentence(components, element){
    let realisedElement = null;

    if (components !== null && components.length !== 0) {
      let realisation = "";
      realisation = this.realiseList(realisation, components, '');
      realisation = this.stripLeadingCommas(realisation);
      realisation = this.capitaliseFirstLetter(realisation);
      realisation = this.terminateSentence(realisation, element.getFeatureAsBoolean(InternalFeature.INTERROGATIVE));

      element.setRealisation(realisation);
      realisedElement = element;
    }

    return realisedElement;
  }

  realiseList(realisation, components, listSeparator = ''){
    let childRealisation = null;

    if (components !== null && components.length !== 0) {
      for (let n = 0; n < components.length; n++){
        let thisElement = components[n];
        let realisedChild = this.realise(thisElement);
        childRealisation = realisedChild.getRealisation();
        
        // check that the child realisation is non-empty
        if(childRealisation !== null && childRealisation !== ""){
          realisation += realisedChild.getRealisation();
          if(components.length > 1 && n < components.length - 1) {
            realisation += listSeparator;
          }
          realisation += ' ';
        }
      }
    }

    return this.stripTrailingSpace(realisation);
  }

  stripLeadingCommas(realisation){
    while(realisation.charAt(0) === ' ' || realisation.charAt(0) === ','){
     realisation = realisation.substr(1);
    }
    return realisation;
  }

  stripTrailingSpace(realisation){
    while(realisation.charAt(realisation.length - 1) === ' '){
     realisation = realisation.substr(0, realisation.length -1);
    }
    return realisation;
  }

  capitaliseFirstLetter(realisation){
    return (/^[a-z]/.test(realisation))
      ? realisation.charAt(0).toUpperCase() + realisation.slice(1)
      : realisation;
  }

  terminateSentence(realisation, interrogative = false){
    realisation = this.stripTrailingSpace(realisation);
    let character = realisation.charAt(realisation.length - 1);
    if(character !== '.' && character !== '?'){
      if(interrogative) {
        realisation += '?';
      } else {
        realisation += '.';
      }
    }
    return realisation;
  }

  realiseCoordinatedPhrase(components){
    let realisation = "";
    let realisedChild = null;

    let length = components.length;

    for(let index = 0; index < length; index++ ){
      realisedChild = components[index];
      if(index < length - 2 && DiscourseFunction.CONJUNCTION == realisedChild.getFeature(InternalFeature.DISCOURSE_FUNCTION)){
        realisation += ", ";
      } else {
        realisedChild = this.realise(realisedChild);
        realisation += realisedChild.getRealisation() + ' ';
      }
    }
    realisation = realisation.trim();
    return new StringElement(realisation.replace(" ,", ","));
  }

  /**
   * Set whether to separate premodifiers using a comma. If <code>true</code>,
   * premodifiers will be comma-separated, as in <i>the long, dark road</i>.
   * If <code>false</code>, they won't.
   * 
   * @param commaSepPremodifiers
   *            the commaSepPremodifiers to set
   */
  setCommaSepPremodifiers(commaSepPremodifiers) {
    this.commaSepPremodifiers = commaSepPremodifiers;
  }
}

export default OrthographyProcessor;
