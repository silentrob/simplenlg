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
import MorphologyProcessor from '../morphology/MorphologyProcessor';
import OrthographyProcessor from '../ortho/orthography';
import SyntaxProcessor from '../syntax/SyntaxProcessor';
import TextFormatter from '../format/TextFormatter';
import DocumentCategory from '../features/DocumentCategory.js';
import DocumentElement from '../framework/documentElement.js';

class Realiser extends NLGModule {
  constructor(lexicon){
    super();

    this.syntax = new SyntaxProcessor();
    this.morphology = new MorphologyProcessor();
    this.orthography = new OrthographyProcessor();
    this.formatter = new TextFormatter();
    this.setLexicon(lexicon);
    this.debug = false;
  }

  setLexicon(newLexicon){
    this.syntax.setLexicon(newLexicon);
    this.morphology.setLexicon(newLexicon);
    this.orthography.setLexicon(newLexicon);
  }

  realise(element){

    if (this.debug){
      console.log("INITIAL TREE\n");
      console.log(element.printTree(null));      
    }

    let postSyntax = this.syntax.realise(element);

    if (this.debug){
      console.log("\n\nPOST-SYNTAX TREE\n");
      console.log(postSyntax.printTree(null));      
    }

    let postMorphology = this.morphology.realise(postSyntax);
    
    if (this.debug){
      console.log("POST-MORPHOLOGY TREE\n");
      console.log(postMorphology.printTree(null));      
    }

    let postOrthography = this.orthography.realise(postMorphology);

    if (this.debug){
      console.log("POST-ORTHOGRAPHY TREE\n");
      console.log(postOrthography.printTree(null));      
    }

    let postFormatter = null;

    if(this.formatter != null) {
      postFormatter = this.formatter.realise(postOrthography);
    } else {
      postFormatter = postOrthography;
    }

    if (this.debug){
      console.log("POST-FORMATTER TREE\n");
      console.log(postFormatter.toString());      
    }

    return postFormatter;
  }

  /**
   * Convenience class to realise any NLGElement as a sentence
   * 
   * @param element
   * @return String realisation of the NLGElement
   */
  realiseSentence(element){
    let realised = null;
    if(element instanceof DocumentElement){
      realised = this.realise(element);
    } else {
      let sentence = new DocumentElement(DocumentCategory.SENTENCE, null);
      sentence.addComponent(element);
      realised = this.realise(sentence);
    }

    return (realised == null) ? null : realised.getRealisation();
  }

  /**
   * Set whether to separate premodifiers using a comma. If <code>true</code>,
   * premodifiers will be comma-separated, as in <i>the long, dark road</i>.
   * If <code>false</code>, they won't. <br/>
   * <strong>Implementation note:</strong>: this method sets the relevant
   * parameter in the
   * {@link simplenlg.orthography.english.OrthographyProcessor}.
   * 
   * @param commaSepPremodifiers
   *            the commaSepPremodifiers to set
   */
  setCommaSepPremodifiers(commaSepPremodifiers){
    if(this.orthography != null) {
      this.orthography.setCommaSepPremodifiers(commaSepPremodifiers);
    }
  }
}

export default Realiser;