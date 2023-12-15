import type { Schema, Attribute } from '@strapi/strapi';

export interface ItemsItemIncluido extends Schema.Component {
  collectionName: 'components_items_item_incluidos';
  info: {
    displayName: 'item';
    icon: 'stack';
    description: '';
  };
  attributes: {
    titulo: Attribute.String & Attribute.Required;
    descripcion: Attribute.Text;
  };
}

export interface PreguntasFrecuentesPregunta extends Schema.Component {
  collectionName: 'components_preguntas_frecuentes_preguntas';
  info: {
    displayName: 'pregunta';
    icon: 'phone';
  };
  attributes: {
    pregunta: Attribute.String & Attribute.Required;
    respuesta: Attribute.Text & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'items.item-incluido': ItemsItemIncluido;
      'preguntas-frecuentes.pregunta': PreguntasFrecuentesPregunta;
    }
  }
}
