declare module 'use-places-autocomplete' {
  export interface Suggestion {
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }

  export interface UsePlacesAutocompleteOptions {
    requestOptions?: {
      componentRestrictions?: {
        country: string | string[];
      };
      types?: string[];
    };
    debounce?: number;
  }

  export interface UsePlacesAutocompleteResult {
    ready: boolean;
    value: string;
    suggestions: {
      status: string;
      data: Suggestion[];
    };
    setValue: (value: string, shouldFetchData?: boolean) => void;
    clearSuggestions: () => void;
  }

  export function getGeocode(args: { address: string }): Promise<google.maps.GeocoderResult[]>;
  export function getLatLng(result: google.maps.GeocoderResult): { lat: number; lng: number };

  export default function usePlacesAutocomplete(
    options?: UsePlacesAutocompleteOptions
  ): UsePlacesAutocompleteResult;
} 