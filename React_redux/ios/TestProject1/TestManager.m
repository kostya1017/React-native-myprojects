//
//  TestManager.m
//  TestProject1
//
//  Created by Baebae on 1/27/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "TestManager.h"

@implementation TestManager
@synthesize bridge = _bridge;
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setAudioFileName:(NSString *)fileName)
{
  audioPlayer = [[STKAudioPlayer alloc] init];
  
  audioPlayer.delegate = self;
  [audioPlayer play:fileName];
}

RCT_EXPORT_METHOD(stopAudio)
{
  [audioPlayer stop];
}

-(void) getLength
{
  double duration = [audioPlayer duration];
  if (duration > 0) {
    NSNumber *myDoubleNumber = [NSNumber numberWithInt:duration];
    [self.bridge.eventDispatcher sendAppEventWithName:@"onDurationChanged"
                                                 body:@{@"duration": [myDoubleNumber stringValue]}];
  }
}
-(void) audioPlayer:(STKAudioPlayer*)audioPlayer didStartPlayingQueueItemId:(NSObject*)queueItemId
{
  [self getLength];
}

-(void) audioPlayer:(STKAudioPlayer*)audioPlayer didFinishBufferingSourceWithQueueItemId:(NSObject*)queueItemId
{
}

-(void) audioPlayer:(STKAudioPlayer*)audioPlayer stateChanged:(STKAudioPlayerState)state previousState:(STKAudioPlayerState)previousState
{
  [self getLength];
}

-(void) audioPlayer:(STKAudioPlayer*)audioPlayer didFinishPlayingQueueItemId:(NSObject*)queueItemId withReason:(STKAudioPlayerStopReason)stopReason andProgress:(double)progress andDuration:(double)duration
{
  [self getLength];
}

-(void) audioPlayer:(STKAudioPlayer*)audioPlayer unexpectedError:(STKAudioPlayerErrorCode)errorCode
{
  [self getLength];
}


@end
