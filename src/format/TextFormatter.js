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

import NLGModule from '../framework/nlgmodule'
import StringElement from '../framework/stringElement';
import DocumentElement from '../framework/documentElement';
import ListElement from '../framework/listElement';
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';

import DocumentCategory from '../features/DocumentCategory';

 /**
 * <p>
 * This processing module adds some simple plain text formatting to the
 * SimpleNLG output. This includes the following:
 * <ul>
 * <li>Adding the document title to the beginning of the text.</li>
 * <li>Adding section titles in the relevant places.</li>
 * <li>Adding appropriate new line breaks for ease-of-reading.</li>
 * <li>Adding list items with ' * '.</li>
 * <li>Adding numbers for enumerated lists (e.g., "1.1 - ", "1.2 - ", etc.)</li>
 * </ul>
 * </p>
 * 
 * @author D. Westwater, University of Aberdeen.
 * @version 4.0
 * 
 */
class TextFormatter extends NLGModule {

  // static private NumberedPrefix numberedPrefix = new NumberedPrefix();

  constructor(){
    super();
  }

  realise(element){

    if (element instanceof Array){
      let realisedList = [];
      if (elements != null) {
        for (let i = 0; i < elements.length; i++){
          realisedList.push(realise(elements[i]));
        }
      }
      return realisedList;
    }

    let realisedComponent = null;
    let realisation = "";
    
    if (element != null) {
      let category = element.getCategory();
      let components = element.getChildren();

      //NB: The order of the if-statements below is important!
      

      // check if this is a canned text first
      if (element instanceof StringElement) {
        realisation += element.getRealisation();
      } else if (category !== ""){
        let title = element instanceof DocumentElement ? element.getTitle() : null;
            
        switch (category){
        case 'DOCUMENT':
          realisation += this.appendTitle(realisation, title, 2);
          realisation += this.realiseSubComponents(realisation, components);
          break;
        case 'SECTION':
          realisation += this.appendTitle(realisation, title, 1);
          realisation += this.realiseSubComponents(realisation, components);
          break;
        case 'LIST':
          realisation += this.realiseSubComponents(realisation, components);
          break;

        // case ENUMERATED_LIST:
        //     numberedPrefix.upALevel();
        //     if (title != null) {
        //         realisation.append(title).append('\n');
        //     }

        //     if (null != components && 0 < components.length) {

        //         realisedComponent = realise(components[0]);
        //         if (realisedComponent != null) {
        //             realisation.append(realisedComponent.getRealisation());
        //         }
        //         for (let i = 1; i < components.length; i++) {
        //             if (realisedComponent != null && !realisedComponent.getRealisation().endsWith("\n")) {
        //               realisation.append(' ');
        //             }
        //             if(components[i].getParent().getCategory() == DocumentCategory.ENUMERATED_LIST) {
        //               numberedPrefix.increment();
        //             }
        //             realisedComponent = this.realise(components.get(i));
        //             if (realisedComponent != null) {
        //                 realisation.append(realisedComponent.getRealisation());
        //             }
        //         }
        //     }

        //     numberedPrefix.downALevel();
        //     break;

        case 'PARAGRAPH':
          if (null != components && 0 < components.length){
            realisedComponent = this.realise(components[0]);

            if (realisedComponent != null) {
              realisation += realisedComponent.getRealisation();
            }
            for (let i = 1; i < components.length; i++){
              if (realisedComponent != null){
                realisation += ' ';
              }
              realisedComponent = this.realise(components[i]);
              if (realisedComponent != null){
                realisation += realisedComponent.getRealisation();
              }
            }
          }
          realisation += "\n\n";
          break;

        case 'SENTENCE':
          realisation += element.getRealisation();
          break;

        case 'LIST_ITEM':
          if(element.getParent() != null) {
              if(element.getParent().getCategory() == DocumentCategory.LIST) {
                  realisation += " * ";
              } else if(element.getParent().getCategory() == DocumentCategory.ENUMERATED_LIST) {
                  realisation += numberedPrefix.getPrefix() + " - ";
              }
          }

          for (let i = 0; i < components.length; i++){
            let eachComponent = components[i];
            realisedComponent = this.realise(eachComponent);
            
            if (realisedComponent != null) {
              realisation += realisedComponent.getRealisation();
              
              if(components.indexOf(eachComponent) < components.size()-1) {
                realisation += ' ';
              }
            }
          }
          //finally, append newline
          realisation += "\n";
          break;
        }

        // also need to check if element is a ListElement (items can
        // have embedded lists post-orthography) or a coordinate
      } else if (element instanceof ListElement || element instanceof CoordinatedPhraseElement) {
        for (let i = 0; i < components.length; i++){
          let eachComponent = components[i];
          realisedComponent = this.realise(eachComponent);
          if (realisedComponent != null) {
            realisation += realisedComponent.getRealisation() + ' ';
          }
        }       
      } 
    }
    
    return new StringElement(realisation);
  }

  /**
   * realiseSubComponents -- Realises subcomponents iteratively.
   * @param realisation -- The current realisation StringBuffer.
   * @param components -- The components to realise.
   */
  realiseSubComponents(realisation, components){
    let realisedComponent;
    for (let i = 0; i < components.length; i++){
      realisedComponent = this.realise(components[i]);
      if (realisedComponent != null) {
        realisation += realisedComponent.getRealisation();
      }
    }
    return realisation;
  }
  
  /**
   * appendTitle -- Appends document or section title to the realised document.
   * @param realisation -- The current realisation StringBuffer.
   * @param title -- The title to append.
   * @param numberOfLineBreaksAfterTitle -- Number of line breaks to append.
   */
  appendTitle(realisation, title, numberOfLineBreaksAfterTitle){
    if (title != null && title != ""){
      realisation += title;
      for(let i = 0; i < numberOfLineBreaksAfterTitle; i++) {
        realisation += "\n";
      }
    }
    return realisation;
  }
}
export default TextFormatter;