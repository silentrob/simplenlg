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


/**
 * <p>
 * This class defines a phrase. It covers the expected phrase types: noun
 * phrases, verb phrases, adjective phrases, adverb phrases and prepositional
 * phrases as well as also covering clauses. Phrases can be constructed from
 * scratch by setting the correct features of the phrase elements. However, it
 * is strongly recommended that the <code>PhraseFactory</code> is used to
 * construct phrases.
 */

import {pullAll, isArray} from 'lodash';
import Element from './element'
import StringElement from './stringElement'
import CoordinatedPhraseElement from './coordinatedPhraseElement';
import LexicalCategory from '../features/LexicalCategory';

import InternalFeature from '../features/InternalFeature';

// a.push(...b)
Array.prototype.addAll = function() {
    this.push.apply(this, this.concat.apply([], arguments));
};

class PhraseElement extends Element {
  constructor(newCategory) {
    super();
    this.setCategory(newCategory);
    this.setFeature('ELIDED', false);
  }
  
  addPostModifier(newPostModifier) {

    let postModifiers = this.getFeatureAsElementList('POSTMODIFIERS');
    if (postModifiers == null) {
      postModifiers = [];
    }

    if (typeof newPostModifier == "string"){
      postModifiers.push(new StringElement(newPostModifier));
    } else {
      newPostModifier.setFeature('DISCOURSE_FUNCTION', 'POST_MODIFIER');
      postModifiers.push(newPostModifier);
    }

    this.setFeature('POSTMODIFIERS', postModifiers);
  }

  clearComplements(){
    this.removeFeature(InternalFeature.COMPLEMENTS);
  }

  getPreModifiers(){
    return this.getFeatureAsElementList('PREMODIFIERS');
  }

  getPostModifiers(){
    return this.getFeatureAsElementList('POSTMODIFIERS');
  }

  setComplement(newComplement){
    if (newComplement instanceof Element){
      let func = newComplement.getFeature('DISCOURSE_FUNCTION');
      this.removeComplements(func);
      this.addComplement(newComplement);
    } else {
      this.setFeature('COMPLEMENTS', null);
      this.addComplement(newComplement);
    }
  }

  setHead(newHead){
    if (newHead == null) {
      this.removeFeature('HEAD');
      return;
    }
    let headElement = (newHead instanceof Element) ? newHead : new StringElement(newHead);
    this.setFeature('HEAD', headElement);
  }
  
  setPreModifier(newPreModifier){
    this.setFeature(InternalFeature.PREMODIFIERS, null);
    this.addPreModifier(newPreModifier);
  }
  
  removeComplements(func){
    let complements = this.getFeatureAsElementList('COMPLEMENTS');

    if (func == null || complements == null || complements.length == 0){
      return;
    }
    
    let complementsToRemove = [];
    for (let i = 0; i < complements.length; i++){
      let complement = complements[i];
      if (func == complement.getFeature('DISCOURSE_FUNCTION')){
        complementsToRemove.push(complement);
      }
    }

    if (complementsToRemove.length !== 0) {
      pullAll(complements, complementsToRemove);
      for (let i = 0; i < complementsToRemove.length; i++){
        complements[complementsToRemove[i]] = undefined;
      }
      
      this.setFeature('COMPLEMENTS', complements);
    }

    return;
  }

  /**
   * <p>
   * Adds a new complement to the phrase element. Complements will be realised
   * in the syntax after the head element of the phrase. Complements differ
   * from post-modifiers in that complements are crucial to the understanding
   * of a phrase whereas post-modifiers are optional.
   * </p>
   * 
   * <p>
   * If the new complement being added is a <em>clause</em> or a
   * <code>CoordinatedPhraseElement</code> then its clause status feature is
   * set to <code>ClauseStatus.SUBORDINATE</code> and it's discourse function
   * is set to <code>DiscourseFunction.OBJECT</code> by default unless an
   * existing discourse function exists on the complement.
   * </p>
   * 
   * <p>
   * Complements can have different functions. For example, the phrase <I>John
   * gave Mary a flower</I> has two complements, one a direct object and one
   * indirect. If a complement is not specified for its discourse function,
   * then this is automatically set to <code>DiscourseFunction.OBJECT</code>.
   * </p>
   * 
   * @param newComplement the new complement as an <code>NLGElement</code>.
   */
  addComplement(newComplement){
    if (typeof newComplement == "string"){
      let newElement = new StringElement(newComplement);
      let complements = this.getFeatureAsElementList('COMPLEMENTS');
      if (complements == null) {
        complements = [];
      }
      complements.push(newElement);
      this.setFeature('COMPLEMENTS', complements);      
    } else {

      let complements = this.getFeatureAsElementList('COMPLEMENTS');
      if (complements == null) {
        complements = [];
      }

      // check if the new complement has a discourse function; if not, assume object
      if(!newComplement.hasFeature('DISCOURSE_FUNCTION')){
        newComplement.setFeature('DISCOURSE_FUNCTION', 'OBJECT');
      }

      if (newComplement.isA('CLAUSE') || newComplement instanceof CoordinatedPhraseElement) {
        newComplement.setFeature('CLAUSE_STATUS', 'SUBORDINATE');

        if (!newComplement.hasFeature('DISCOURSE_FUNCTION')) {
          newComplement.setFeature('DISCOURSE_FUNCTION', 'OBJECT');
        }
      }

      complements.push(newComplement);
      this.setFeature('COMPLEMENTS', complements);
    }
  }

  addFrontModifier(newFrontModifier){
    let frontModifiers = this.getFeatureAsElementList('FRONT_MODIFIERS');
    if (frontModifiers == null){
      frontModifiers = [];
    }
    frontModifiers.push((typeof newFrontModifier == "string") ? new StringElement(newFrontModifier) : newFrontModifier);
    this.setFeature('FRONT_MODIFIERS', frontModifiers);
  }

  addModifier(modifier) {
    // default addModifier - always make modifier a preModifier
    if (modifier == null){
      return;
    }

    this.addPreModifier(modifier);
    return;
  }

  addPreModifier(newPreModifier){
    if (typeof newPreModifier == "string"){
      this.addPreModifier(new StringElement(newPreModifier));
    } else {
      let  preModifiers = this.getFeatureAsElementList('PREMODIFIERS');
      if (preModifiers == null) {
        preModifiers = [];
      }
      preModifiers.push(newPreModifier);
      this.setFeature('PREMODIFIERS', preModifiers);
    }
  }

  getChildren(){
    let children = [];
    let category = this.getCategory();
    let currentElement = null;
    category = (category instanceof LexicalCategory) ? category.name : category;
    switch (category){
      case 'CLAUSE':
        currentElement = this.getFeatureAsElement('CUE_PHRASE');
        if (currentElement != null) {
          children.push(currentElement);
        }
        children.addAll(this.getFeatureAsElementList('FRONT_MODIFIERS'));
        children.addAll(this.getFeatureAsElementList('PREMODIFIERS'));
        children.addAll(this.getFeatureAsElementList('SUBJECTS'));
        children.addAll(this.getFeatureAsElementList('VERB_PHRASE'));
        children.addAll(this.getFeatureAsElementList('COMPLEMENTS'));
        break;

      case 'NOUN_PHRASE':
        currentElement = this.getFeatureAsElement('SPECIFIER');
        if (currentElement != null) {
          children.push(currentElement);
        }
        children.addAll(this.getFeatureAsElementList('PREMODIFIERS'));
        currentElement = this.getHead();
        if (currentElement != null) {
          children.push(currentElement);
        }
        children.addAll(this.getFeatureAsElementList('COMPLEMENTS'));
        children.addAll(this.getFeatureAsElementList('POSTMODIFIERS'));
        break;

      case 'VERB_PHRASE':
        children.addAll(this.getFeatureAsElementList('PREMODIFIERS'));
        currentElement = this.getHead();
        if (currentElement != null) {
          children.push(currentElement);
        }
        children.addAll(this.getFeatureAsElementList('COMPLEMENTS'));
        children.addAll(this.getFeatureAsElementList('POSTMODIFIERS'));
        break;

      case 'CANNED_TEXT':
        // Do nothing
        break;

      default:
        children.addAll(this.getFeatureAsElementList('PREMODIFIERS'));
        currentElement = this.getHead();
        if (currentElement != null){
          children.push(currentElement);
        }
        children.addAll(this.getFeatureAsElementList('COMPLEMENTS'));
        children.addAll(this.getFeatureAsElementList('POSTMODIFIERS'));
        break;
    }
    
    return children;
  }

  getHead() {
    return this.getFeatureAsElement('HEAD');
  }

  setPostModifier(newPostModifier) {
    this.setFeature(InternalFeature.POSTMODIFIERS, null);
    this.addPostModifier(newPostModifier);
  }

  printTree(indent){
    let thisIndent = indent == null ? " |-" : indent + " |-";
    let childIndent = indent == null ? " | " : indent + " | ";
    let lastIndent = indent == null ? " \\-" : indent + " \\-";
    let lastChildIndent = indent == null ? "   " : indent + "   ";
    let print = "PhraseElement: category=";
    print += this.getCategory().toString() + ", features={";

    let features = this.getAllFeatures();
    for (let eachFeature in features){
      if(isArray(features[eachFeature])){
        print += eachFeature + "=" + features[eachFeature].map(function(each){ return each.toString(); });
      } else {
        if (features[eachFeature])
          print += eachFeature + "=" + features[eachFeature].toString() + ' ';
      }
      
    }
    print += "}\n";

    let children = this.getChildren();
    let length = children.length - 1;
    for (let index = 0; index < length; index++) {
      print += thisIndent + children[index].printTree(childIndent);
    }

    if (length >= 0) {
      print += lastIndent + children[length].printTree(lastChildIndent);
    }
    return print;
  }

}

export default PhraseElement;
