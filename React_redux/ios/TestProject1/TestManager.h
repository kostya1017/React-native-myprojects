//
//  TestManager.h
//  TestProject1
//
//  Created by Baebae on 1/27/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "STKAudioPlayer.h"

@interface TestManager : NSObject <RCTBridgeModule, STKAudioPlayerDelegate>
{
  STKAudioPlayer* audioPlayer;
}
@end
