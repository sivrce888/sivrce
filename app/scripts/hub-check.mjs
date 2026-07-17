import { listingHubPath, listingHubAnchor } from '../app/src/lib/seo-pages.ts'
console.log('vake sale path:', listingHubPath({ dealType:'sale', propType:'apartment', city:'თბილისი', district:'ვაკე' }))
console.log('vake sale anchor:', listingHubAnchor({ dealType:'sale', propType:'apartment', city:'თბილისი', district:'ვაკე' }))
console.log('unknown dist:', listingHubPath({ dealType:'sale', propType:'apartment', city:'თბილისი', district:'თელავის რაიონი' }))
console.log('pledge land:', listingHubPath({ dealType:'pledge', propType:'land', city:'თბილისი', district:'ვაკე' }))
console.log('batumi house:', listingHubPath({ dealType:'sale', propType:'house', city:'ბათუმი', district:'ძველი ბათუმი' }))
